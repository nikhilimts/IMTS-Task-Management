import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Download,
  Calendar,
  Building,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { SystemReport, Department } from '../services/adminService';
import { useNavigate } from 'react-router-dom';

const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<SystemReport | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [dateRange, selectedDepartment]);

  const fetchInitialData = async () => {
    try {
      const [reportResponse, departmentsResponse] = await Promise.all([
        adminService.getSystemReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }),
        adminService.getAllDepartments()
      ]);

      if (reportResponse.data.success) {
        setReport(reportResponse.data.data);
      }

      if (departmentsResponse.data.success) {
        setDepartments(departmentsResponse.data.data);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: any = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      if (selectedDepartment !== 'all') {
        params.departmentId = selectedDepartment;
      }

      console.log('Fetching report with params:', params);
      const response = await adminService.getSystemReport(params);

      if (response.data.success) {
        setReport(response.data.data);
        console.log('Report fetched successfully:', response.data.data);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics
  const getApprovedTasks = () => {
    const approved = report?.tasksByStatus?.find(item => item._id === 'approved')?.count || 0;
    const completed = report?.tasksByStatus?.find(item => item._id === 'completed')?.count || 0;
    return approved + completed;
  };

  const getPendingTasks = () => {
    return report?.tasksByStatus?.find(item => item._id === 'pending')?.count || 0;
  };

  const getCompletedTasks = () => {
    const approved = report?.tasksByStatus?.find(item => item._id === 'approved')?.count || 0;
    const completed = report?.tasksByStatus?.find(item => item._id === 'completed')?.count || 0;
    return approved + completed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Reports</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Comprehensive analytics and task management reports
                </p>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => window.print()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
                <button
                  onClick={() => navigate('/admin/dashboard')}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {report && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Tasks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{report?.tasksByStatus?.reduce((sum, item) => sum + item.count, 0) || 0}</p>
                  </div>
                </div>
              </div>

              {/* Approved Tasks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Approved Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{getApprovedTasks()}</p>
                  </div>
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{getCompletedTasks()}</p>
                  </div>
                </div>
              </div>

              {/* Pending Approval */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                    <p className="text-2xl font-bold text-gray-900">{getPendingTasks()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Task Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Medium Priority */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <h3 className="text-sm font-semibold text-gray-900">Medium Priority</h3>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {report.tasksByPriority?.find(item => item._id === 'medium')?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tasks</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* High Priority */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                      <h3 className="text-sm font-semibold text-gray-900">High Priority</h3>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {report.tasksByPriority?.find(item => item._id === 'high')?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tasks</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Urgent Priority */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-1">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <h3 className="text-sm font-semibold text-gray-900">Urgent Priority</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {report.tasksByPriority?.find(item => item._id === 'urgent')?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tasks</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Department Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.departmentPerformance?.map((dept, index) => {
                      const totalTasks = dept.statusBreakdown.reduce((sum, status) => sum + status.count, 0);
                      const approvedTasks = (dept.statusBreakdown.find(s => s.status === 'approved')?.count || 0) + 
                                          (dept.statusBreakdown.find(s => s.status === 'completed')?.count || 0);
                      const completedTasks = (dept.statusBreakdown.find(s => s.status === 'approved')?.count || 0) + 
                                           (dept.statusBreakdown.find(s => s.status === 'completed')?.count || 0);
                      const pendingTasks = dept.statusBreakdown.find(s => s.status === 'pending')?.count || 0;

                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {dept._id.departmentName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {totalTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {approvedTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {completedTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                            {pendingTasks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => navigate(`/admin/departments/${dept._id.departmentId}`)}
                              className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
