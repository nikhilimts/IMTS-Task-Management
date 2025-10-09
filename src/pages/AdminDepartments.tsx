import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaTasks, 
  FaEye,
  FaChartBar,
  FaSearch,
  FaArrowLeft,
  FaBuilding
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { adminService } from '../services/adminService';
import type { Department } from '../services/adminService';
import { useNavigate } from 'react-router-dom';

const AdminDepartments: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    // Filter departments based on search term
    const filtered = departments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
  }, [departments, searchTerm]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDepartments();
      
      if (response.data.success) {
        setDepartments(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading departments:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin role required.');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load departments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDepartment = (departmentId: string) => {
    navigate(`/admin/departments/${departmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
                <p className="text-gray-600">Manage all departments across the organization</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredDepartments.length} of {departments.length} departments
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((department) => (
            <div key={department._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {department.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {department.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{department.description}</p>
                )}

                {department.hodUser && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">HOD:</p>
                    <p className="text-sm font-medium text-gray-900">{department.hodUser.name}</p>
                    <p className="text-xs text-gray-500">{department.hodUser.email}</p>
                  </div>
                )}

                {department.stats && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaUsers className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{department.stats.totalUsers}</span>
                      </div>
                      <p className="text-xs text-gray-500">Users</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <FaTasks className="h-4 w-4 text-purple-600 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{department.stats.totalTasks}</span>
                      </div>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                  </div>
                )}

                {department.stats && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completion Rate</span>
                      <span className="font-medium text-green-600">{department.stats.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${department.stats.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDepartment(department._id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center space-x-1"
                  >
                    <FaEye />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => navigate(`/admin/departments/${department._id}/reports`)}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 flex items-center justify-center space-x-1"
                  >
                    <FaChartBar />
                    <span>Reports</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No departments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No departments available.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDepartments;