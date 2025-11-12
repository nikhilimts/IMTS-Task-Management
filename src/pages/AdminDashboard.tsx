import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt, FaFilter, FaSearch, FaEye, FaUsers, FaHome } from 'react-icons/fa';
import { AiOutlineSearch } from 'react-icons/ai';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import taskService from '../services/taskService';
import type { Task as TaskType, TaskFilters } from '../services/taskService';
import NotificationBell from '../components/NotificationBell';
import GroupTaskView from '../components/GroupTaskView';
import OverviewerTasksTable from '../components/OverviewerTasksTable';
import ErrorBoundary from '../components/ErrorBoundary';

// interface TaskStats {
//   total: number;
//   created: number;
//   assigned: number;
//   in_progress: number;
//   completed: number;
//   approved: number;
//   rejected: number;
//   high_priority: number;
//   urgent_priority: number;
//   overdue: number;
// }

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  
  // Task management state
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter options state
  const [creators, setCreators] = useState<Array<{_id: string; name: string}>>([]);
  const [assignees, setAssignees] = useState<Array<{_id: string; name: string}>>([]);
  const [loadingFilterData, setLoadingFilterData] = useState(false);

  // Load tasks and stats on component mount
  useEffect(() => {
    loadTasks();
    loadCurrentUser();
  }, [filters]);

  const loadCurrentUser = async () => {
    try {
      const userData = authService.getCurrentUser();
      setCurrentUser(userData);
      
      // Redirect admin users to system admin dashboard
      if (userData && userData.role === 'admin') {
        navigate('/admin/dashboard');
        return;
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  // const loadFilterData = async () => {
  //   // Fallback function - try to load from API endpoints if available
  //   try {
  //     setLoadingFilterData(true);
      
  //     const [creatorsResponse, assigneesResponse] = await Promise.allSettled([
  //       taskService.getTaskCreators(),
  //       taskService.getTaskAssignees()
  //     ]);
      
  //     if (creatorsResponse.status === 'fulfilled' && creatorsResponse.value.success) {
  //       setCreators(creatorsResponse.value.data);
  //     }
      
  //     if (assigneesResponse.status === 'fulfilled' && assigneesResponse.value.success) {
  //       setAssignees(assigneesResponse.value.data);
  //     }
  //   } catch (error) {
  //     console.warn('API endpoints not available, using local data extraction');
  //   } finally {
  //     setLoadingFilterData(false);
  //   }
  // };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks(filters);
      setTasks(response.data.tasks);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Update filter data when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      updateFilterDataFromTasks();
    }
  }, [tasks]);

  const updateFilterDataFromTasks = () => {
    try {
      setLoadingFilterData(true);
      
      // Extract unique creators
      const uniqueCreators = tasks.reduce((acc, task) => {
        if (task.createdBy && task.createdBy._id && task.createdBy.name) {
          const existing = acc.find(c => c._id === task.createdBy._id);
          if (!existing) {
            acc.push({
              _id: task.createdBy._id,
              name: task.createdBy.name
            });
          }
        }
        return acc;
      }, [] as Array<{_id: string; name: string}>);

      // Extract unique assignees (including group task members)
      const uniqueAssignees = tasks.reduce((acc, task) => {
        task.assignedTo.forEach(assignment => {
          if (assignment.user && assignment.user._id && assignment.user.name) {
            const existing = acc.find(a => a._id === assignment.user._id);
            if (!existing) {
              acc.push({
                _id: assignment.user._id,
                name: assignment.user.name
              });
            }
          }
        });
        return acc;
      }, [] as Array<{_id: string; name: string}>);

      // Sort both arrays by name
      uniqueCreators.sort((a, b) => a.name.localeCompare(b.name));
      uniqueAssignees.sort((a, b) => a.name.localeCompare(b.name));

      setCreators(uniqueCreators);
      setAssignees(uniqueAssignees);
    } catch (error) {
      console.error('Failed to update filter data:', error);
    } finally {
      setLoadingFilterData(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const handleTaskUpdate = (updatedTask: TaskType) => {
    setTasks(prev => prev.map(task => 
      task._id === updatedTask._id ? updatedTask : task
    ));
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(prev => prev === taskId ? null : taskId);
  };

  const getGroupTaskProgress = (task: TaskType) => {
    if (!task.isGroupTask || !task.assignedTo.length) return 0;
    
    const completedCount = task.assignedTo.filter(
      assignment => assignment.individualStage === 'done' || assignment.status === 'completed'
    ).length;
    
    return Math.round((completedCount / task.assignedTo.length) * 100);
  };

  const getApprovalStatus = (task: TaskType) => {
    if (!task.isGroupTask) {
      // For individual tasks, check the overall task status
      if (task.status === 'approved') return { status: 'Approved', color: 'bg-green-100 text-green-800' };
      if (task.status === 'rejected') return { status: 'Rejected', color: 'bg-red-100 text-red-800' };
      return { status: 'Pending', color: 'bg-gray-100 text-gray-800' };
    }
    
    // For group tasks, check individual approvals
    const approved = task.assignedTo.filter(a => a.approval === 'approved').length;
    const rejected = task.assignedTo.filter(a => a.approval === 'rejected').length;
    const total = task.assignedTo.length;
    
    if (approved === total) return { status: 'All Approved', color: 'bg-green-100 text-green-800' };
    if (rejected > 0) return { status: `${approved}/${total} Approved, ${rejected} Rejected`, color: 'bg-yellow-100 text-yellow-800' };
    if (approved > 0) return { status: `${approved}/${total} Approved`, color: 'bg-blue-100 text-blue-800' };
    return { status: 'Pending', color: 'bg-gray-100 text-gray-800' };
  };


  // Helper functions
  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else {
      return `${diffDays} days left`;
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    if (status === 'completed' || status === 'approved') return false;
    return new Date(deadline) < new Date();
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-400 text-white';
      case 'low': return 'bg-green-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  // Utility functions for date formatting and checking overdue status

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      authService.logout();
      navigate('/login');
    }
  };

  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100">
      {/* Main Content */}
      <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div className="flex items-center w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Task Management Dashboard</h1>
          </div>
          <div className="flex flex-wrap space-x-2 sm:space-x-3 items-center ml-auto mt-2 sm:mt-0">
            <button 
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-blue-700 transition-colors"
            >
              <BsFillPlusCircleFill /> <span className="hidden sm:inline">Create Task</span><span className="sm:hidden">Create</span>
            </button>
            {currentUser?.role === 'hod' && (
              <button 
                onClick={() => navigate('/hod/dashboard')}
                className="bg-orange-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-orange-700 transition-colors"
              >
                <FaHome /> <span className="hidden sm:inline">Back to HOD Dashboard</span><span className="sm:hidden">HOD Dashboard</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/report/individual')}
              className="bg-green-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-green-700 transition-colors"
            >
              <FaEye /> <span className="hidden sm:inline">My Report</span><span className="sm:hidden">Report</span>
            </button>
            <NotificationBell />
            <div className="relative user-dropdown">
              <FaUserCircle 
                className="text-xl text-gray-600 cursor-pointer hover:text-gray-800" 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              />
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Overviewer Tasks Section */}
        <ErrorBoundary fallback={
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">Unable to load overviewer tasks section.</p>
          </div>
        }>
          <OverviewerTasksTable className="mb-6" />
        </ErrorBoundary>

        {/* Progress Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 w-full">
          <ProgressCard 
            percentage={dashboardStats.notStarted.percentage} 
            label={dashboardStats.notStarted.label} 
            count={dashboardStats.notStarted.count}
            color="#6b7280" 
          />
          <ProgressCard 
            percentage={dashboardStats.pending.percentage} 
            label={dashboardStats.pending.label} 
            count={dashboardStats.pending.count}
            color="#8b5cf6" 
          />
          <ProgressCard 
            percentage={dashboardStats.done.percentage} 
            label={dashboardStats.done.label} 
            count={dashboardStats.done.count}
            color="#059669" 
          />
        </div> */}

        {/* Search and Filter Section - Above Task List */}
        <div className="space-y-4 mb-6 w-full">
          {/* Search Bar */}
          <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 h-8">
              <h3 className="text-lg font-medium text-gray-900">Search & Filter Tasks</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-gray-700 transition-colors h-8 w-auto whitespace-nowrap"
              >
                <FaFilter /> <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>
            
            {/* Fixed height search container */}
            <div className="flex items-center relative w-full h-10 mb-2">
              <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row h-10">
                <div className="relative w-full h-10">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 py-2 pl-10 pr-4 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                  />
                  <AiOutlineSearch className="absolute left-3 top-2.5 text-gray-500 z-10" />
                </div>
                <button
                  type="submit"
                  className="mt-2 sm:mt-0 sm:ml-2 px-4 py-2 h-10 bg-blue-600 text-white rounded-md sm:rounded-r-md hover:bg-blue-700 transition-colors w-full sm:w-auto flex items-center justify-center"
                >
                  <FaSearch />
                </button>
              </form>
            </div>

            {/* Filters Panel - Fixed container height */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t min-h-[200px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                    >
                      <option value="">All Status</option>
                      <option value="created">Pending</option>
                      <option value="completed"> Completed Group Task</option>
                      <option value="approved">Completed Individual Task</option>
                      
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={filters.priority || ''}
                      onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                    >
                      <option value="">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    <select
                      value={filters.stage || ''}
                      onChange={(e) => handleFilterChange('stage', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                    >
                      <option value="">All Stages</option>
                      <option value="not_started">Not Started</option>
                      <option value="pending">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creator
                      {loadingFilterData && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
                    </label>
                    <select
                      value={filters.createdBy || ''}
                      onChange={(e) => handleFilterChange('createdBy', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                      disabled={loadingFilterData}
                    >
                      <option value="">All Creators</option>
                      {creators.map((creator) => (
                        <option key={creator._id} value={creator._id}>
                          {creator.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                      {loadingFilterData && <span className="text-xs text-gray-500 ml-2">(Loading...)</span>}
                    </label>
                    <select
                      value={filters.assignedTo || ''}
                      onChange={(e) => handleFilterChange('assignedTo', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                      disabled={loadingFilterData}
                    >
                      <option value="">All Assignees</option>
                      {assignees.map((assignee) => (
                        <option key={assignee._id} value={assignee._id}>
                          {assignee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                      value={filters.sortBy || 'createdAt'}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
                    >
                      <option value="createdAt">Created Date</option>
                      <option value="deadline">Deadline</option>
                      <option value="priority">Priority</option>
                      <option value="status">Status</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center h-10">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort Order:</label>
                    <button
                      onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`px-3 py-1 rounded-md text-sm h-8 whitespace-nowrap ${
                        filters.sortOrder === 'desc' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {filters.sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setFilters({
                        page: 1,
                        limit: 10,
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                      });
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors h-8 flex items-center whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Task Table */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <div className="text-lg font-semibold">
              Tasks ({pagination.totalTasks})
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading tasks...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks found. {searchTerm && `Try adjusting your search term "${searchTerm}".`}
            </div>
          ) : (
            <table className="min-w-full text-left text-sm overflow-x-auto">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 whitespace-nowrap">Type</th>
                  <th className="py-2 px-4 whitespace-nowrap">Creator</th>
                  <th className="py-2 px-4 whitespace-nowrap w-1/4">Task Title</th>
                  <th className="py-2 px-4 whitespace-nowrap">Assigned To</th>
                  <th className="py-2 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-2 px-4 whitespace-nowrap">Stage</th>
                  <th className="py-2 px-4 whitespace-nowrap">Approval Status</th>
                  <th className="py-2 px-4 whitespace-nowrap">Deadline</th>
                  <th className="py-2 px-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isExpanded = expandedTask === task._id;
                  const progress = getGroupTaskProgress(task);
                  
                  return (
                    <React.Fragment key={task._id}>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {task.isGroupTask ? (
                            <div className="flex items-center space-x-1">
                              <FaUsers className="text-blue-600 w-4 h-4" />
                              <span className="text-xs text-blue-600 font-medium">Group</span>
                              {task.isGroupTask && (
                                <span className="text-xs text-gray-500">
                                  {progress}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">Individual</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <div>
                            <div className="font-medium">{task.createdBy?.name || 'Unknown User'}</div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div>
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          {task.assignedTo.length > 0 ? (
                            <div>
                              {task.isGroupTask ? (
                                <div>
                                  <div className="text-xs font-medium text-blue-600">
                                    {task.assignedTo.length} members
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {task.assignedTo.filter(a => a.individualStage === 'done').length} completed
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  {task.assignedTo.slice(0, 2).map((assignment, idx) => (
                                    <div key={idx} className="text-xs">
                                      {assignment.user?.name || 'Unknown User'}
                                    </div>
                                  ))}
                                  {task.assignedTo.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      +{task.assignedTo.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Unassigned</span>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStageColor(task.stage)}`}>
                            {task.stage.charAt(0).toUpperCase() + task.stage.slice(1)}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {(() => {
                            const approvalInfo = getApprovalStatus(task);
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs ${approvalInfo.color}`}>
                                {approvalInfo.status}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-4">
                          <div className="text-xs">
                            <div>{new Date(task.deadline).toLocaleDateString()}</div>
                            <div className={`${isOverdue(task.deadline, task.status) ? 'text-red-500' : 'text-gray-500'}`}>
                              {formatDate(task.deadline)}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex space-x-1">
                            {task.isGroupTask && (
                              <button 
                                className="text-blue-500 hover:text-blue-700 p-1"
                                title={isExpanded ? "Collapse Group View" : "Expand Group View"}
                                onClick={() => toggleTaskExpansion(task._id)}
                              >
                                <FaUsers />
                              </button>
                            )}
                            <button 
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="View Details"
                              onClick={() => navigate(task.isGroupTask ? `/tasks/${task._id}/group` : `/tasks/${task._id}`)}
                            >
                              <FaEye />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Group Task View */}
                      {isExpanded && task.isGroupTask && currentUser && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-gray-50">
                            <div className="p-4">
                              <GroupTaskView 
                                task={task}
                                currentUserId={currentUser._id}
                                onTaskUpdate={handleTaskUpdate}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
