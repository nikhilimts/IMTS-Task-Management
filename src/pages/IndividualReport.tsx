import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import taskService from '../services/taskService';
import type { Task } from '../services/taskService';
import authService from '../services/authService';
import { ArrowLeft, Download, Filter, Search, Calendar, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';

// Helper function to sanitize task user references
const sanitizeTask = (task: Task): Task => {
  return {
    ...task,
    createdBy: task.createdBy || {
      _id: '',
      name: 'Unknown User',
      email: 'unknown@example.com',
      role: 'unknown'
    },
    assignedTo: task.assignedTo?.map(assignment => ({
      ...assignment,
      user: assignment.user || {
        _id: '',
        name: 'Unknown User',
        email: 'unknown@example.com',
        role: 'unknown'
      }
    })) || []
  };
};

interface FilterState {
  status: string;
  priority: string;
  stage: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  startDate: string;
  endDate: string;
}

const IndividualReport: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [totalTasks, setTotalTasks] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    stage: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    startDate: '',
    endDate: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  // Load tasks
  const loadTasks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await taskService.getIndividualReport({
        page,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      
      // Sanitize tasks to prevent null reference errors
      const sanitizedTasks = response.data.tasks.map(sanitizeTask);
      
      setTasks(sanitizedTasks);
      setTotalTasks(response.data.pagination.totalTasks);
      setCurrentPage(response.data.pagination.currentPage);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Load all tasks for export (without pagination)
  const loadAllTasksForExport = async (): Promise<Task[]> => {
    try {
      const response = await taskService.getIndividualReport({
        limit: 10000, // Large limit to get all tasks
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });
      // Sanitize tasks to prevent null reference errors
      return response.data.tasks.map(sanitizeTask);
    } catch (error) {
      console.error('Error loading all tasks:', error);
      return [];
    }
  };

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      stage: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      startDate: '',
      endDate: ''
    });
  };

  const getStatusBadge = (status: string, stage: string) => {
    if (stage === 'done' && (status === 'approved' || status === 'completed')) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>;
    }
    if (stage === 'done' && status !== 'approved') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending Approval</span>;
    }
    if (stage === 'pending') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Progress</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Not Started</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[priority as keyof typeof colors] || colors.medium}`}>
        {priority?.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (deadline: string, status: string, stage: string) => {
    if (stage === 'done' && status === 'approved') return false;
    return new Date(deadline) < new Date();
  };

  const getTaskTypeIcon = (task: Task) => {
    if (task.isGroupTask) {
      return (
        <div title="Group Task">
          <User className="w-4 h-4 text-blue-500" />
        </div>
      );
    }
    return (
      <div title="Individual Task">
        <User className="w-4 h-4 text-gray-500" />
      </div>
    );
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      
      if (!currentUser) {
        toast.error('User information not available');
        return;
      }
      
      const allTasks = await loadAllTasksForExport();
      
      if (allTasks.length === 0) {
        toast.warning('No tasks to export');
        return;
      }

      // Prepare data for Excel
      const excelData = allTasks.map((task, index) => {
        const userAssignment = task.assignedTo.find(a => a.user._id === currentUser?._id);
        const isCompleted = task.stage === 'done' && (task.status === 'approved' || task.status === 'completed');
        const isOverdueTask = isOverdue(task.deadline, task.status, task.stage);
        
        return {
          'S.No': index + 1,
          'Title': task.title,
          'Description': task.description,
          'Type': task.isGroupTask ? 'Group Task' : 'Individual Task',
          'Priority': task.priority?.toUpperCase(),
          'Status': isCompleted ? 'Completed' : task.stage === 'done' ? 'Pending Approval' : task.stage === 'pending' ? 'In Progress' : 'Not Started',
          'Assigned Date': formatDate(userAssignment?.assignedAt || task.createdAt),
          'Due Date': formatDate(task.deadline),
          'Created Date': formatDate(task.createdAt),
          'Completed Date': task.completedAt ? formatDate(task.completedAt) : 'Not Completed',
          'Creator': task.createdBy?.name || 'Unknown',
          'Creator Email': task.createdBy?.email || 'Unknown',
          'Department': task.department?.name || 'Unknown',
          'Is Overdue': isOverdueTask ? 'Yes' : 'No',
          'Days Since Assignment': Math.floor((new Date().getTime() - new Date(userAssignment?.assignedAt || task.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          'Tags': task.tags?.join(', ') || 'None',
          'Attachments Count': task.attachments?.length || 0,
          'Remarks Count': (task.remarks?.creator?.length || 0) + (task.remarks?.assignee?.length || 0) + (task.remarks?.general?.length || 0)
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // S.No
        { wch: 30 },  // Title
        { wch: 40 },  // Description
        { wch: 15 },  // Type
        { wch: 10 },  // Priority
        { wch: 15 },  // Status
        { wch: 15 },  // Assigned Date
        { wch: 15 },  // Due Date
        { wch: 15 },  // Created Date
        { wch: 15 },  // Completed Date
        { wch: 20 },  // Creator
        { wch: 25 },  // Creator Email
        { wch: 20 },  // Department
        { wch: 10 },  // Is Overdue
        { wch: 15 },  // Days Since Assignment
        { wch: 20 },  // Tags
        { wch: 15 },  // Attachments Count
        { wch: 15 }   // Remarks Count
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'My Tasks Report');

      // Generate filename with current date and user name
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const userName = currentUser?.name ? currentUser.name.replace(/\s+/g, '_') : 'User';
      const fileName = `Individual_Tasks_Report_${userName}_${dateStr}_${timeStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);
      
      toast.success(`Report exported successfully! (${allTasks.length} tasks)`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const taskStats = {
    total: totalTasks,
    completed: tasks.filter(t => t.stage === 'done' && (t.status === 'approved' || t.status === 'completed')).length,
    inProgress: tasks.filter(t => t.stage === 'pending').length,
    notStarted: tasks.filter(t => t.stage === 'not_started').length,
    overdue: tasks.filter(t => isOverdue(t.deadline, t.status, t.stage)).length
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your task report.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </button>
              <h1 className="text-xl font-semibold text-gray-900">My Tasks Report</h1>
            </div>
            <button
              onClick={exportToExcel}
              disabled={exportLoading || loading}
              className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export to Excel'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Report for: {currentUser.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-900">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-900">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Not Started</p>
                  <p className="text-2xl font-bold text-gray-600">{taskStats.notStarted}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-900">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-700 hover:text-gray-900"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
            </button>
          </div>
          
          {showFilters && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Search tasks..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={filters.stage}
                    onChange={(e) => handleFilterChange('stage', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Stages</option>
                    <option value="not_started">Not Started</option>
                    <option value="pending">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="deadline">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Tasks List</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No tasks found with the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.map((task) => (
                      <tr 
                        key={task._id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {getTaskTypeIcon(task)}
                            <span className="ml-2 text-sm text-gray-600">
                              {task.isGroupTask ? 'Group' : 'Individual'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getPriorityBadge(task.priority)}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {getStatusBadge(task.status, task.stage)}
                            {isOverdue(task.deadline, task.status, task.stage) && (
                              <div className="text-xs text-red-600 mt-1">Overdue</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                            {formatDate(task.deadline)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{task.createdBy?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{task.createdBy?.email || 'unknown@example.com'}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadTasks(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadTasks(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * 20, totalTasks)}</span> of{' '}
                        <span className="font-medium">{totalTasks}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => loadTasks(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => loadTasks(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => loadTasks(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualReport;