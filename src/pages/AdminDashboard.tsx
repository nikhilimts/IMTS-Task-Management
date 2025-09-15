import React, { useState, useEffect } from 'react';
import { FaBell, FaUserCircle, FaBars, FaTimes, FaSignOutAlt, FaFilter, FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaDownload, FaComment } from 'react-icons/fa';
import { AiOutlineSearch } from 'react-icons/ai';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import taskService from '../services/taskService';
import type { Task as TaskType, TaskFilters, DashboardStatsResponse } from '../services/taskService';
import ProgressCard from '../components/ProgressCard';

// ✅ Real task interfaces and data
interface TaskStats {
  total: number;
  created: number;
  assigned: number;
  in_progress: number;
  completed: number;
  approved: number;
  rejected: number;
  high_priority: number;
  urgent_priority: number;
  overdue: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Task management state
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    created: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    approved: 0,
    rejected: 0,
    high_priority: 0,
    urgent_priority: 0,
    overdue: 0,
  });
  const [dashboardStats, setDashboardStats] = useState({
    notStarted: { count: 0, label: 'Not Started', percentage: 0 },
    pending: { count: 0, label: 'Pending', percentage: 0 },
    done: { count: 0, label: 'Done', percentage: 0 },
    totalAssigned: 0,
  });
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

  // Load tasks and stats on component mount
  useEffect(() => {
    loadTasks();
    loadTaskStats();
    loadDashboardStats();
  }, [filters]);

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

  const loadTaskStats = async () => {
    try {
      const response = await taskService.getTaskStats();
      setTaskStats(response.data);
    } catch (error) {
      console.error('Failed to load task stats:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await taskService.getDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
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

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        toast.success('Task deleted successfully');
        loadTasks(); // Reload tasks
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      await taskService.updateTaskStatus(taskId, { status: status as any });
      toast.success('Task status updated successfully');
      loadTasks(); // Reload tasks
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    }
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
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-500 text-white';
      case 'assigned': return 'bg-purple-500 text-white';
      case 'in_progress': return 'bg-yellow-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'approved': return 'bg-green-600 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'transferred': return 'bg-gray-500 text-white';
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
    navigate('/create-task');
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
    <div className="flex flex-col md:flex-row h-screen font-sans bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 z-20 bg-white w-60 h-full shadow-md transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 text-2xl font-bold border-b">IMTS</div>
        <nav className="space-y-2 px-4 mt-4">
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>📊</span> <span>Dashboard</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md bg-purple-100 font-semibold text-purple-600">
            <span>✅</span> <span>Task</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>📄</span> <span>Report</span>
          </div>
          <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 cursor-pointer">
            <span>⚙️</span> <span>Setting</span>
          </div>
        </nav>
        <div className="p-4 mt-auto border-t absolute bottom-0 w-full">
          <div className="flex items-center space-x-3 mb-3">
            <img src="/avatar.png" alt="Admin" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <div className="font-bold">Admin</div>
              <div className="text-sm text-gray-500">admin@gmail.com</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 p-2 rounded-md hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black opacity-40 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div className="flex items-center w-full md:w-1/3 relative">
            <button className="md:hidden text-2xl mr-3" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <form onSubmit={handleSearch} className="w-full flex">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                <FaSearch />
              </button>
            </form>
            <AiOutlineSearch className="absolute left-12 md:left-3 top-2.5 text-gray-500" />
          </div>
          <div className="flex space-x-3 items-center ml-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-gray-700 transition-colors"
            >
              <FaFilter /> <span>Filters</span>
            </button>
            <button 
              onClick={handleCreateTask}
              className="bg-blue-600 text-white px-3 py-2 rounded-md flex items-center space-x-2 text-sm hover:bg-blue-700 transition-colors"
            >
              <BsFillPlusCircleFill /> <span>Create Task</span>
            </button>
            <FaBell className="text-xl text-gray-600 cursor-pointer hover:text-gray-800" />
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="created">Created</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Stages</option>
                  <option value="planning">Planning</option>
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="review">Review</option>
                  <option value="deployment">Deployment</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={filters.sortBy || 'createdAt'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="deadline">Deadline</option>
                  <option value="priority">Priority</option>
                  <option value="status">Status</option>
                  <option value="title">Title</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort Order:</label>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`px-3 py-1 rounded-md text-sm ${
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
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
        </div>

        {/* Task Table */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
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
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 whitespace-nowrap">Creator</th>
                  <th className="py-2 px-4 whitespace-nowrap">Task Title</th>
                  <th className="py-2 px-4 whitespace-nowrap">Assigned To</th>
                  <th className="py-2 px-4 whitespace-nowrap">Status</th>
                  <th className="py-2 px-4 whitespace-nowrap">Priority</th>
                  <th className="py-2 px-4 whitespace-nowrap">Stage</th>
                  <th className="py-2 px-4 whitespace-nowrap">Deadline</th>
                  <th className="py-2 px-4 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div>
                        <div className="font-medium">{task.createdBy.name}</div>
                        <div className="text-xs text-gray-500">{task.createdBy.role}</div>
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
                          {task.assignedTo.slice(0, 2).map((assignment, idx) => (
                            <div key={idx} className="text-xs">
                              {assignment.user.name}
                            </div>
                          ))}
                          {task.assignedTo.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{task.assignedTo.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs border-none ${getStatusColor(task.status)}`}
                      >
                        <option value="created">Created</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="transferred">Transferred</option>
                      </select>
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
                      <div className="text-xs">
                        <div>{new Date(task.deadline).toLocaleDateString()}</div>
                        <div className={`${isOverdue(task.deadline, task.status) ? 'text-red-500' : 'text-gray-500'}`}>
                          {formatDate(task.deadline)}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex space-x-1">
                        <button 
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="View Details"
                          onClick={() => navigate(`/tasks/${task._id}`)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="text-green-500 hover:text-green-700 p-1"
                          title="Edit Task"
                          onClick={() => navigate(`/tasks/${task._id}/edit`)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="text-purple-500 hover:text-purple-700 p-1"
                          title="Add Comment"
                          onClick={() => {
                            const comment = prompt('Add a comment:');
                            if (comment) {
                              taskService.addRemark(task._id, { text: comment })
                                .then(() => {
                                  toast.success('Comment added successfully');
                                  loadTasks();
                                })
                                .catch(() => toast.error('Failed to add comment'));
                            }
                          }}
                        >
                          <FaComment />
                        </button>
                        {task.attachments.length > 0 && (
                          <button 
                            className="text-indigo-500 hover:text-indigo-700 p-1"
                            title="Download Attachments"
                            onClick={() => {
                              // Download first attachment as example
                              taskService.downloadAttachment(task._id, task.attachments[0]._id);
                            }}
                          >
                            <FaDownload />
                          </button>
                        )}
                        <button 
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete Task"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
