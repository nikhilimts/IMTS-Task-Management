import api from './api';

export interface DashboardStats {
  totalEmployees: number;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: string;
}

export interface Department {
  _id: string;
  name: string;
  description: string;
}

export interface DashboardData {
  department: Department;
  stats: DashboardStats;
}

export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  completionRate: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  taskStats: TaskStats;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  deadline: string;
  createdAt: string;
  assignedTo: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
  }>;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TasksByStatus {
  _id: string;
  count: number;
}

export interface TasksByPriority {
  _id: string;
  count: number;
}

export interface EmployeePerformance {
  employee: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: string;
  };
}

export interface DepartmentReport {
  department: Department;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  tasksByStatus: TasksByStatus[];
  tasksByPriority: TasksByPriority[];
  employeePerformance: EmployeePerformance[];
}

class HODService {
  // Get dashboard data
  async getDashboard(): Promise<DashboardData> {
    const response = await api.get('/hod/dashboard');
    return response.data.data;
  }

  // Get department tasks
  async getDepartmentTasks(
    filters: TaskFilters = {}
  ): Promise<PaginationResponse<Task>> {
    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await api.get(`/hod/tasks?${params}`);
    return {
      data: response.data.data.tasks,
      pagination: response.data.data.pagination
    };
  }

  // Get department employees
  async getDepartmentEmployees(
    filters: EmployeeFilters = {}
  ): Promise<PaginationResponse<Employee>> {
    const params = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await api.get(`/hod/employees?${params}`);
    return {
      data: response.data.data.employees,
      pagination: response.data.data.pagination
    };
  }

  // Toggle user access
  async toggleUserAccess(userId: string, isActive: boolean): Promise<void> {
    await api.put(`/hod/employees/${userId}/access`, { isActive });
  }

  // Get department report
  async getDepartmentReport(
    startDate?: string,
    endDate?: string
  ): Promise<DepartmentReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/hod/reports?${params}`);
    return response.data.data;
  }

  // Get employee detail
  async getEmployeeDetail(employeeId: string): Promise<{ data: Employee }> {
    const response = await api.get(`/hod/employees/${employeeId}`);
    return response.data;
  }

  // Get employee tasks
  async getEmployeeTasks(employeeId: string): Promise<{ data: Task[] }> {
    const response = await api.get(`/hod/employees/${employeeId}/tasks`);
    return response.data;
  }
}

export default new HODService();