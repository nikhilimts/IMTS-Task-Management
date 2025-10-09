import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaTasks, 
  FaBuilding, 
  FaChartBar,
  FaEye,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { adminService } from '../services/adminService';
import type { AdminDashboardData } from '../services/adminService';
import { useNavigate } from 'react-router-dom';

const SystemAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin role required.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-200 text-green-900';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overallStats, departmentStats, recentTasks } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Admin Dashboard</h1>
              <p className="text-gray-600">System-wide overview and management</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/admin/reports')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <FaChartBar />
                <span>Reports</span>
              </button>
              <button
                onClick={() => navigate('/admin/departments')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center space-x-2"
              >
                <FaBuilding />
                <span>Departments</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUsers className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaBuilding className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Departments</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalDepartments}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaTasks className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.totalTasks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaChartBar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{overallStats.completionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{overallStats.activeTasks}</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Active Tasks</p>
                  <p className="text-xs text-gray-400">Currently in progress</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">{overallStats.completedTasks}</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                  <p className="text-xs text-gray-400">Successfully finished</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">{overallStats.overdueTasks}</span>
                  </div>
                </div>
                <div className="ml-5">
                  <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                  <p className="text-xs text-gray-400">Past deadline</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Statistics */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Department Performance</h3>
                  <button
                    onClick={() => navigate('/admin/departments')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {departmentStats.map((dept) => (
                    <div key={dept.department._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-gray-900">{dept.department.name}</h4>
                        <button
                          onClick={() => navigate(`/admin/departments/${dept.department._id}`)}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 text-sm"
                        >
                          <FaEye />
                          <span>View Details</span>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-gray-500">Users</p>
                          <p className="font-semibold text-blue-600">{dept.stats.totalUsers}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Tasks</p>
                          <p className="font-semibold text-purple-600">{dept.stats.totalTasks}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Active</p>
                          <p className="font-semibold text-orange-600">{dept.stats.activeTasks}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Completion</p>
                          <p className="font-semibold text-green-600">{dept.stats.completionRate}%</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{dept.stats.completionRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${dept.stats.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {dept.stats.overdueTasks > 0 && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <FaExclamationTriangle className="mr-1" />
                          <span>{dept.stats.overdueTasks} overdue tasks</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tasks</h3>
                <div className="space-y-3">
                  {recentTasks.slice(0, 10).map((task) => (
                    <div key={task._id} className="border-l-4 border-blue-400 pl-3 py-2 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.department.name} • {task.createdBy.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
                {recentTasks.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No recent tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminDashboard;