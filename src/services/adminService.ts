import api from './api';

export interface AdminDashboardData {
  overallStats: {
    totalUsers: number;
    totalDepartments: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: string;
  };
  departmentStats: Array<{
    department: {
      _id: string;
      name: string;
      description: string;
    };
    stats: {
      totalUsers: number;
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
      overdueTasks: number;
      completionRate: string;
    };
  }>;
  recentTasks: Array<{
    _id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    department: { name: string };
    createdBy: { name: string; email: string };
    assignedTo: Array<{ user: { name: string; email: string } }>;
  }>;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  hod?: {
    _id?: string;
    name: string;
    email: string;
  };
  isActive: boolean;
  stats?: {
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    completionRate: string;
  };
}

export interface DepartmentDetail {
  department: Department;
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: string;
  };
}

export interface SystemReport {
  reportPeriod: {
    startDate: string;
    endDate: string;
    department: string;
  };
  tasksByStatus: Array<{ _id: string; count: number }>;
  tasksByPriority: Array<{ _id: string; count: number }>;
  departmentPerformance: Array<{
    _id: {
      departmentId: string;
      departmentName: string;
    };
    statusBreakdown: Array<{ status: string; count: number }>;
    totalTasks: number;
  }>;
  userActivity: Array<{ _id: string; tasksCreated: number }>;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: {
    name: string;
  };
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    overdueTasks: number;
    completionRate: string;
  };
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  createdAt: string;
  department: { name: string };
  createdBy: { name: string; email: string };
  assignedTo: Array<{ user: { name: string; email: string } }>;
  overviewers: Array<{ user: { name: string; email: string } }>;
}

export const adminService = {
  // Dashboard
  getDashboard: () => 
    api.get<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard'),

  // Departments
  getAllDepartments: () => 
    api.get<{ success: boolean; data: Department[] }>('/admin/departments'),
  
  getDepartmentDetail: (departmentId: string) => 
    api.get<{ success: boolean; data: DepartmentDetail }>(`/admin/departments/${departmentId}`),

  getDepartmentTasks: (departmentId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    assignedTo?: string;
    sortBy?: string;
    sortOrder?: string;
    startDate?: string;
    endDate?: string;
  }) => 
    api.get<{ 
      success: boolean; 
      data: { 
        tasks: Task[]; 
        pagination: {
          currentPage: number;
          totalPages: number;
          totalTasks: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        }
      } 
    }>(`/admin/departments/${departmentId}/tasks`, { params }),

  getDepartmentEmployees: (departmentId: string, params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => 
    api.get<{ 
      success: boolean; 
      data: { 
        employees: Employee[]; 
        pagination: {
          currentPage: number;
          totalPages: number;
          totalEmployees: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        }
      } 
    }>(`/admin/departments/${departmentId}/employees`, { params }),

  // Reports
  getSystemReport: (params?: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
  }) => 
    api.get<{ success: boolean; data: SystemReport }>('/admin/reports/system', { params }),

  // User Management
  toggleUserAccess: (userId: string, isActive: boolean) =>
    api.put(`/super-admin/users/${userId}/toggle-access`, { isActive }),

  // Get all employees across departments
  getAllEmployees: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
    search?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => 
    api.get<{ 
      success: boolean; 
      data: { 
        users: Employee[]; 
        pagination: {
          currentPage: number;
          totalPages: number;
          totalUsers: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        }
      } 
    }>('/super-admin/employees', { params }),

  // Employee detail methods
  getEmployeeDetail: (employeeId: string) =>
    api.get(`/admin/employees/${employeeId}`),

  getEmployeeTasks: (employeeId: string) =>
    api.get(`/admin/employees/${employeeId}/tasks`),

  // Department report method
  getDepartmentReport: async (departmentId: string, startDate: string, endDate: string) => {
    try {
      const response = await api.get(`/admin/departments/${departmentId}/reports`, {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      throw new Error('Failed to fetch department report');
    }
  },
};