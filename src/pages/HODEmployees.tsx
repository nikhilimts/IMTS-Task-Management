import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  User,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import authService from '../services/authService';
import hodService from '../services/hodService';
import type { Employee, EmployeeFilters } from '../services/hodService';

const HODEmployees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await hodService.getDepartmentEmployees(filters);
      setEmployees(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessChange = async (userId: string, isActive: boolean) => {
    try {
      setActionLoading(userId);
      await hodService.toggleUserAccess(userId, isActive);
      
      // Update local state
      setEmployees(prev => prev.map(emp => 
        emp._id === userId 
          ? { ...emp, isActive }
          : emp
      ));
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update employee access');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: any) => {
    setFilters((prev: EmployeeFilters) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing other filters
    }));
  };

  const handleSearch = (searchTerm: string) => {
    handleFilterChange('search', searchTerm);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        <UserX className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };

  if (loading && employees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Department Employees</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.department?.name} Department - {pagination.totalItems} employees
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.location.href = '/hod/dashboard'}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Access Filter */}
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.isActive !== undefined ? filters.isActive.toString() : ''}
              onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">All Employees</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            {/* Role Filter */}
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.sortBy === 'role' ? 'role' : ''}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="role">Sort by Role</option>
            </select>

            {/* Sort By */}
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setFilters(prev => ({ ...prev, sortBy, sortOrder: sortOrder as 'asc' | 'desc' }));
              }}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
            </select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Employees Grid */}
        {employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No employees match your current filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {employee.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(employee.isActive)}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">Role:</span>
                    <span className="ml-2 capitalize">{employee.role}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {formatDate(employee.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAccessChange(employee._id, !employee.isActive)}
                      disabled={actionLoading === employee._id}
                      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                        employee.isActive
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {actionLoading === employee._id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1"></div>
                      ) : employee.isActive ? (
                        <UserX className="h-3 w-3 mr-1" />
                      ) : (
                        <UserCheck className="h-3 w-3 mr-1" />
                      )}
                      {employee.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <button
                    onClick={() => window.location.href = `/employees/${employee._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow-sm">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * (filters.limit || 10) + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * (filters.limit || 10), pagination.totalItems)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HODEmployees;