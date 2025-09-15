import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'hod' | 'admin';
  department: {
    _id: string;
    name: string;
  };
  isActive: boolean;
}

export interface UserDropdownResponse {
  success: boolean;
  data: {
    users: Array<{
      _id: string;
      name: string;
      email: string;
      role: string;
      department: {
        _id: string;
        name: string;
      };
    }>;
  };
}

class UserService {
  /**
   * Get users for dropdown selection
   */
  async getUsersForDropdown(): Promise<UserDropdownResponse> {
    const response = await api.get('/users/dropdown');
    return response.data;
  }

  /**
   * Get all employees
   */
  async getAllEmployees(): Promise<UserDropdownResponse> {
    const response = await api.get('/users/employees');
    return response.data;
  }
}

export default new UserService();