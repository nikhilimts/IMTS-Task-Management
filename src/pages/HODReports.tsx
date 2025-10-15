import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';
import authService from '../services/authService';
import hodService from '../services/hodService';
import type { DepartmentReport } from '../services/hodService';

const HODReports: React.FC = () => {
  const [report, setReport] = useState<DepartmentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const user = authService.getCurrentUser();

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const reportData = await hodService.getDepartmentReport(
        dateRange.startDate,
        dateRange.endDate
      );
      setReport(reportData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Department Reports</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.department?.name} Department Analytics
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.print()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
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

      {/* Date Range Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Report Period:</span>
            </div>
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
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {report && (
          <>
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">{report.department.name} </h2>
                <p className="text-gray-600 mt-2">
                  Report Period: {formatDate(report.reportPeriod.startDate)} - {formatDate(report.reportPeriod.endDate)}
                </p>
              </div>
            </div>

            {/* Tasks by Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Tasks by Status
                </h3>
                <div className="space-y-4">
                  {report.tasksByStatus.map((item) => {
                    const total = report.tasksByStatus.reduce((sum, task) => sum + task.count, 0);
                    const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${getStatusColor(item._id)} mr-3`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item._id.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.count}</span>
                          <span className="text-xs text-gray-400">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tasks by Priority */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Tasks by Priority
                </h3>
                <div className="space-y-4">
                  {report.tasksByPriority.map((item) => {
                    const total = report.tasksByPriority.reduce((sum, task) => sum + task.count, 0);
                    const percentage = total > 0 ? (item.count / total * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={item._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${getPriorityColor(item._id)} mr-3`}></div>
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {item._id}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{item.count}</span>
                          <span className="text-xs text-gray-400">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Employee Performance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Employee Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tasks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overdue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.employeePerformance.map((performance) => (
                      <tr key={performance.employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {performance.employee.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {performance.employee.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {performance.stats.totalTasks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-gray-900">{performance.stats.completedTasks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm text-gray-900">{performance.stats.overdueTasks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {performance.stats.completionRate}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
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

export default HODReports;