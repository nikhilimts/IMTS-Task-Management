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
  const [activeTab, setActiveTab] = useState<'employees' | 'tasks'>('employees');
  
  // Pagination states
  const [employeePage, setEmployeePage] = useState(1);
  const [taskPage, setTaskPage] = useState(1);
  const [employeePagination, setEmployeePagination] = useState<any>(null);
  const [taskPagination, setTaskPagination] = useState<any>(null);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Employee task view states
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeTasks, setEmployeeTasks] = useState<any[]>([]);
  const [loadingEmployeeTasks, setLoadingEmployeeTasks] = useState(false);
  const [employeeTaskPagination, setEmployeeTaskPagination] = useState<any>(null);
  const [employeeTaskPage, setEmployeeTaskPage] = useState(1);
  
  // Employee statistics
  const [employeeStats, setEmployeeStats] = useState<any>(null);
  const [loadingEmployeeStats, setLoadingEmployeeStats] = useState(false);
  
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

  // Calculate employee statistics from tasks
  const calculateEmployeeStats = (tasks: any[]) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed' || task.status === 'approved').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress' || task.status === 'assigned').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'created').length;
    const rejectedTasks = tasks.filter(task => task.status === 'rejected').length;
    const overdueTasks = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      return dueDate < now && !['completed', 'approved'].includes(task.status);
    }).length;
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0';
    
    // Priority breakdown
    const highPriorityTasks = tasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length;
    const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length;
    const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      rejectedTasks,
      overdueTasks,
      completionRate,
      highPriorityTasks,
      mediumPriorityTasks,
      lowPriorityTasks
    };
  };

  // Fetch tasks for a specific employee
  const fetchEmployeeTasks = async (employeeId: string, page: number = 1) => {
    if (!departmentId) return;
    
    try {
      setLoadingEmployeeTasks(true);
      setLoadingEmployeeStats(true);
      
      // Fetch paginated tasks for display
      const response = await adminService.getDepartmentTasks(departmentId, {
        page,
        limit: itemsPerPage,
        assignedTo: employeeId
      });
      
      // Fetch all tasks for statistics (without pagination)
      const allTasksResponse = await adminService.getDepartmentTasks(departmentId, {
        page: 1,
        limit: 1000, // Large limit to get all tasks
        assignedTo: employeeId
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
      
      const allTasks = allTasksResponse.data.data.tasks.map((task: any) => ({
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
      
      setEmployeeTasks(tasks);
      setEmployeeTaskPagination(response.data.data.pagination);
      setEmployeeStats(calculateEmployeeStats(allTasks));
    } catch (err) {
      console.error('Error fetching employee tasks:', err);
    } finally {
      setLoadingEmployeeTasks(false);
      setLoadingEmployeeStats(false);
    }
  };

  // Handle employee click
  const handleEmployeeClick = (employee: any) => {
    setSelectedEmployee(employee);
    setEmployeeTaskPage(1);
    fetchEmployeeTasks(employee._id);
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
        <div className="flex flex-wrap justify-center gap-6 mb-8">
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

          
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('employees');
                  setSelectedEmployee(null);
                  setEmployeeTasks([]);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'employees'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Employees ({department.statistics.totalEmployees})
              </button>
              <button
                onClick={() => {
                  setActiveTab('tasks');
                  setSelectedEmployee(null);
                  setEmployeeTasks([]);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Tasks ({department.statistics.totalTasks})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'employees' && (
              <div className="space-y-6">
                {/* Employee List or Selected Employee Tasks */}
                {!selectedEmployee ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Employees</h3>
                    <p className="text-sm text-gray-600 mb-4">Click on an employee to view their tasks</p>
                    {loadingEmployees ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : department.employees.length > 0 ? (
                      <div className="space-y-4">
                        {department.employees.map((employee) => (
                          <div
                            key={employee._id}
                            onClick={() => handleEmployeeClick(employee)}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                                    {employee.name}
                                  </h4>
                                  <p className="text-sm text-gray-600">{employee.email}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                      {employee.role}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Joined: {new Date(employee.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-blue-600">
                                <span className="text-sm font-medium">View Tasks →</span>
                              </div>
                            </div>
                          </div>
                        ))}
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
                ) : (
                  /* Selected Employee Tasks View */
                  <div>
                    <div className="flex items-center space-x-4 mb-6">
                      <button
                        onClick={() => {
                          setSelectedEmployee(null);
                          setEmployeeTasks([]);
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Employees</span>
                      </button>
                      <div className="h-6 w-px bg-gray-300" />
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedEmployee.name}</h3>
                          <p className="text-sm text-gray-600">{selectedEmployee.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Employee Performance Report */}
                    {loadingEmployeeStats ? (
                      <div className="mb-6">
                        <div className="animate-pulse">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="bg-gray-200 rounded-lg p-4 h-24"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : employeeStats && (
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Performance Report</h4>
                        
                        {/* Main Statistics Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <div className="flex items-center">
                              <CheckSquare className="w-6 h-6 text-blue-600" />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                                <p className="text-2xl font-bold text-gray-900">{employeeStats.totalTasks}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <div className="flex items-center">
                              <TrendingUp className="w-6 h-6 text-green-600" />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{employeeStats.completedTasks}</p>
                                <p className="text-xs text-gray-500">{employeeStats.completionRate}% completion rate</p>
                              </div>
                            </div>
                          </div>

                          

                          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                            <div className="flex items-center">
                              <Calendar className="w-6 h-6 text-red-600" />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">{employeeStats.overdueTasks}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Status Breakdown */}
                          <div className="bg-white rounded-lg shadow p-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Status Breakdown</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pending</span>
                                <span className="text-sm font-medium text-yellow-600">{employeeStats.pendingTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">In Progress</span>
                                <span className="text-sm font-medium text-blue-600">{employeeStats.inProgressTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Completed</span>
                                <span className="text-sm font-medium text-green-600">{employeeStats.completedTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Rejected</span>
                                <span className="text-sm font-medium text-red-600">{employeeStats.rejectedTasks}</span>
                              </div>
                            </div>
                          </div>

                          {/* Priority Breakdown */}
                          <div className="bg-white rounded-lg shadow p-4">
                            <h5 className="text-sm font-semibold text-gray-700 mb-3">Priority Breakdown</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">High/Urgent</span>
                                <span className="text-sm font-medium text-red-600">{employeeStats.highPriorityTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Medium</span>
                                <span className="text-sm font-medium text-yellow-600">{employeeStats.mediumPriorityTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Low</span>
                                <span className="text-sm font-medium text-green-600">{employeeStats.lowPriorityTasks}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="mt-4 bg-white rounded-lg shadow p-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Performance Indicators</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                parseFloat(employeeStats.completionRate) >= 80 ? 'text-green-600' :
                                parseFloat(employeeStats.completionRate) >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {employeeStats.completionRate}%
                              </div>
                              <div className="text-xs text-gray-500">Completion Rate</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                employeeStats.overdueTasks === 0 ? 'text-green-600' :
                                employeeStats.overdueTasks <= 2 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {employeeStats.overdueTasks}
                              </div>
                              <div className="text-xs text-gray-500">Overdue Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                employeeStats.totalTasks >= 10 ? 'text-blue-600' :
                                employeeStats.totalTasks >= 5 ? 'text-yellow-600' :
                                'text-gray-600'
                              }`}>
                                {employeeStats.totalTasks}
                              </div>
                              <div className="text-xs text-gray-500">Tasks Assigned</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <h4 className="text-md font-medium text-gray-900 mb-4">Tasks Assigned to {selectedEmployee.name}</h4>
                    
                    {loadingEmployeeTasks ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : employeeTasks.length > 0 ? (
                      <div className="space-y-4">
                        {employeeTasks.map((task) => (
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
                          pagination={employeeTaskPagination}
                          currentPage={employeeTaskPage}
                          onPageChange={(page) => {
                            setEmployeeTaskPage(page);
                            fetchEmployeeTasks(selectedEmployee._id, page);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No tasks assigned to {selectedEmployee.name}</p>
                      </div>
                    )}
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