import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckSquare, Clock, TrendingUp, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminService } from '../services/adminService';

interface DepartmentDetailData {
  _id: string;
  name: string;
  hod: {
    _id?: string;
    name: string;
    email: string;
  } | null;
  employees: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  tasks: Array<{
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    isGroupTask: boolean;
    assignedTo: {
      _id: string;
      name: string;
    };
    createdAt: string;
    dueDate: string;
  }>;
  statistics: {
    totalEmployees: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
  };
}

const AdminDepartmentDetail: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<DepartmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'tasks'>('overview');
  
  // Pagination states
  const [employeePage, setEmployeePage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [employeePagination, setEmployeePagination] = useState<any>(null);
  const [taskPagination, setTaskPagination] = useState<any>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDepartmentDetail = async () => {
      if (!departmentId) return;
      
      try {
        setLoading(true);
        const response = await adminService.getDepartmentDetail(departmentId);
        
        // Transform the backend response to match our interface
        const backendData = response.data.data;
        const transformedData: DepartmentDetailData = {
          _id: backendData.department._id,
          name: backendData.department.name,
          hod: backendData.department.hod || null,
          employees: [], // We'll fetch this separately
          tasks: [], // We'll fetch this separately
          statistics: {
            totalEmployees: backendData.stats.totalUsers,
            totalTasks: backendData.stats.totalTasks,
            completedTasks: backendData.stats.completedTasks,
            pendingTasks: 0, // Will be calculated
            inProgressTasks: backendData.stats.activeTasks
          }
        };
        
        setDepartment(transformedData);
        
        // Initially set empty data, we'll load separately with pagination
        setDepartment(transformedData);
        
      } catch (err) {
        setError('Failed to fetch department details');
        console.error('Error fetching department detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentDetail();
  }, [departmentId]);

  // Fetch employees with pagination
  const fetchEmployees = async (page: number = 1) => {
    if (!departmentId) return;
    
    try {
      setLoadingEmployees(true);
      const response = await adminService.getDepartmentEmployees(departmentId, {
        page,
        limit: itemsPerPage
      });
      
      const employees = response.data.data.employees.map((emp: any) => ({
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        createdAt: emp.createdAt
      }));
      
      setDepartment(prev => prev ? { ...prev, employees } : null);
      setEmployeePagination(response.data.data.pagination);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Fetch tasks with pagination
  const fetchTasks = async (page: number = 1) => {
    if (!departmentId) return;
    
    try {
      setLoadingTasks(true);
      const response = await adminService.getDepartmentTasks(departmentId, {
        page,
        limit: itemsPerPage
      });
      
      const tasks = response.data.data.tasks.map((task: any) => ({
        _id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        isGroupTask: task.isGroupTask || false,
        assignedTo: task.assignedTo[0]?.user || { _id: '', name: 'Unassigned' },
        createdAt: task.createdAt,
        dueDate: task.deadline
      }));
      
      setDepartment(prev => prev ? { ...prev, tasks } : null);
      setTaskPagination(response.data.data.pagination);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Load initial data when tab changes
  useEffect(() => {
    if (activeTab === 'employees' && department && department.employees.length === 0) {
      fetchEmployees(employeePage);
    } else if (activeTab === 'tasks' && department && department.tasks.length === 0) {
      fetchTasks(taskPage);
    }
  }, [activeTab, departmentId, employeePage, taskPage]);

  // Handle task click navigation
  const handleTaskClick = (task: any) => {
    if (task.isGroupTask) {
      navigate(`/tasks/${task._id}/group`);
    } else {
      navigate(`/tasks/${task._id}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-200 text-green-900';
      case 'in-progress':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-200 text-red-900';
      case 'created':
        return 'bg-gray-100 text-gray-800';
      case 'transferred':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  // Pagination component
  const PaginationComponent: React.FC<{
    pagination: any;
    currentPage: number;
    onPageChange: (page: number) => void;
  }> = ({ pagination, currentPage, onPageChange }) => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalTasks || pagination.totalEmployees)} of {pagination.totalTasks || pagination.totalEmployees} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Department not found'}</p>
            <Link
              to="/admin/departments"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Departments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/admin/departments"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Departments
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{department.name}</h1>
              <p className="text-gray-600 mt-1">
                Head of Department: {department.hod?.name || 'Not assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{department.statistics.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckSquare className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{department.statistics.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                <p className="text-2xl font-bold text-green-600">{department.statistics.completedTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-yellow-600">{department.statistics.pendingTasks}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Employees 
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tasks
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* HOD Information */}
                {department.hod && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Head of Department</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <User className="w-10 h-10 text-gray-400" />
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{department.hod.name}</p>
                          <p className="text-gray-600">{department.hod.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">Completed</p>
                      <p className="text-2xl font-bold text-green-700">{department.statistics.completedTasks}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 font-medium">In Progress</p>
                      <p className="text-2xl font-bold text-yellow-700">{department.statistics.inProgressTasks}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600 font-medium">Pending</p>
                      <p className="text-2xl font-bold text-red-700">{department.statistics.pendingTasks}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Employees</h3>
                {loadingEmployees ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : department.employees.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {department.employees.map((employee) => (
                          <tr key={employee._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="w-8 h-8 text-gray-400" />
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {employee.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(employee.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationComponent
                      pagination={employeePagination}
                      currentPage={employeePage}
                      onPageChange={(page) => {
                        setEmployeePage(page);
                        fetchEmployees(page);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No employees found in this department</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Tasks</h3>
                {loadingTasks ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : department.tasks.length > 0 ? (
                  <div className="space-y-4">
                    {department.tasks.map((task) => (
                      <div
                        key={task._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                                {task.title}
                              </h4>
                              {task.isGroupTask && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  <Users className="w-3 h-3 mr-1" />
                                  Group Task
                                </span>
                              )}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <User className="w-4 h-4 mr-1" />
                                {task.assignedTo.name || 'Unassigned'}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Created: {new Date(task.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 text-blue-600">
                            <span className="text-sm font-medium">View Details →</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <PaginationComponent
                      pagination={taskPagination}
                      currentPage={taskPage}
                      onPageChange={(page) => {
                        setTaskPage(page);
                        fetchTasks(page);
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tasks found in this department</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDepartmentDetail;