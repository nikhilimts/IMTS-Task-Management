import React, { useState, useEffect } from 'react';
import { FaEye, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import type { Task } from '../services/taskService';

interface OverviewerTasksTableProps {
  className?: string;
}

const OverviewerTasksTable: React.FC<OverviewerTasksTableProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewerTasks();
  }, []);

  const loadOverviewerTasks = async () => {
    try {
      setLoading(true);
      console.log('Loading overviewer tasks...');
      
      // Use the dedicated overviewer tasks endpoint
      const response = await api.get('/tasks/overview');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      if (response.data && response.data.success) {
        // Handle the correct response structure from backend
        // Backend returns: { success: true, data: { tasks: [...], count: N } }
        const tasksData = response.data.data?.tasks || response.data.data || [];
        console.log('Tasks data extracted:', tasksData);
        console.log('Is tasks data an array?', Array.isArray(tasksData));
        console.log('Tasks count:', Array.isArray(tasksData) ? tasksData.length : 0);
        
        if (Array.isArray(tasksData) && tasksData.length > 0) {
          console.log('First task sample:', tasksData[0]);
        }
        
        setTasks(Array.isArray(tasksData) ? tasksData : []);
      } else {
        console.error('Invalid response structure:', response.data);
        setTasks([]);
      }
    } catch (error: any) {
      console.error('Error loading overviewer tasks:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // If the endpoint doesn't exist or fails, set empty array instead of showing error
      setTasks([]);
      if (error.response?.status !== 404) {
        toast.error('Failed to load overviewer tasks');
      }
    } finally {
      setLoading(false);
      console.log('Loading complete. Final tasks state length:', tasks.length);
    }
  };

  const handleViewTask = (taskId: string) => {
    // Navigate to overviewer-specific view
    navigate(`/tasks/${taskId}/overview`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      created: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800',
      transferred: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks You're Overviewing</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Tasks You're Overviewing</h2>
        <p className="text-sm text-gray-600 mt-1">
          Tasks where you have been assigned as an overviewer with view-only access
        </p>
      </div>

      {!Array.isArray(tasks) || tasks.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <FaEye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p>No tasks found where you are an overviewer</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(tasks) && tasks.map((task) => (
                <tr key={task._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {task.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <FaCalendarAlt className="text-gray-400" size={12} />
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                      {isOverdue(task.deadline) && (
                        <FaExclamationTriangle className="text-red-500" size={12} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col space-y-1">
                      {task.assignedTo?.slice(0, 2).map((assignment, index) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {assignment.user.name}
                        </span>
                      ))}
                      {task.assignedTo && task.assignedTo.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{task.assignedTo.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewTask(task._id)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaEye className="mr-1" size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OverviewerTasksTable;