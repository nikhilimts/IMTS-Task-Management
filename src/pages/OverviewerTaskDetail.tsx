import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaDownload, FaUsers, FaClock, FaEye,
  FaCalendarAlt, FaUser, FaBuilding, FaFilePdf, FaImage, FaFile
} from 'react-icons/fa';
import taskService from '../services/taskService';
import api from '../services/api';
import type { Task } from '../services/taskService';
import NotificationBell from '../components/NotificationBell';

const OverviewerTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // States
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await taskService.getTask(id);
      
      if (response && response.success && response.data && response.data.task) {
        const taskData = response.data.task;
        setTask(taskData);
      } else {
        toast.error('Task not found');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error loading task:', error);
      toast.error('Failed to load task details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFile = (taskId: string, attachmentId: string) => {
    const fileUrl = `${api.defaults.baseURL}/tasks/${taskId}/attachments/${attachmentId}/view`;
    window.open(fileUrl, '_blank');
  };

  const isPDF = (fileName: string) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const isImage = (fileName: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const isViewable = (fileName: string) => {
    return isPDF(fileName) || isImage(fileName);
  };

  const getFileIcon = (fileName: string) => {
    if (isPDF(fileName)) {
      return <FaFilePdf className="text-red-500" />;
    } else if (isImage(fileName)) {
      return <FaImage className="text-blue-500" />;
    } else {
      return <FaFile className="text-gray-500" />;
    }
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

  const getStageColor = (stage: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-200 text-green-900',
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <FaArrowLeft />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                {task.title} - Overviewer View
              </h1>
              {/* Overviewer Indicator */}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <FaEye className="mr-1" size={14} />
                Overviewer - Read Only
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <NotificationBell />
              <div className="text-sm text-gray-500">
                View-only access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Read-only Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2">
            <FaEye className="text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Overviewer Access</p>
              <p className="text-xs text-blue-600">
                You are viewing this task as an overviewer. You have read-only access to all task information.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Task Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900 font-medium">{task.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <p className="text-gray-900">
                      {new Date(task.deadline).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {task.tags?.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {(!task.tags || task.tags.length === 0) && (
                      <span className="text-gray-500 text-sm">No tags</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Stage (Read-only) */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Progress</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className={`w-full px-3 py-2 border border-gray-200 rounded-md ${getStatusColor(task.status)}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <div className={`w-full px-3 py-2 border border-gray-200 rounded-md ${getStageColor(task.stage)}`}>
                    {task.stage === 'not_started' ? 'Not Started' : 
                     task.stage === 'pending' ? 'In Progress' : 'Done'}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments (Read-only) */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
              
              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div key={attachment._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(attachment.originalName)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isViewable(attachment.originalName) && (
                          <button
                            onClick={() => handleViewFile(task._id, attachment._id)}
                            className="text-green-600 hover:text-green-800"
                            title={isPDF(attachment.originalName) ? "View PDF" : "View Image"}
                          >
                            <FaEye />
                          </button>
                        )}
                        <button
                          onClick={() => taskService.downloadAttachment(task._id, attachment._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Download"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No attachments</p>
              )}
            </div>

            {/* Remarks Section (Read-only) */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Remarks & Comments</h2>
              
              <div className="space-y-3">
                {(() => {
                  // Combine all remarks from different categories into one array
                  const allRemarks = [];
                  
                  if (task.remarks?.creator) {
                    allRemarks.push(...task.remarks.creator.map(remark => ({ ...remark, category: 'creator' })));
                  }
                  if (task.remarks?.assignee) {
                    allRemarks.push(...task.remarks.assignee.map(remark => ({ ...remark, category: 'assignee' })));
                  }
                  if (task.remarks?.general) {
                    allRemarks.push(...task.remarks.general.map(remark => ({ ...remark, category: 'general' })));
                  }
                  
                  // Sort by creation date (latest first)
                  allRemarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  
                  if (allRemarks.length === 0) {
                    return <p className="text-gray-500 text-sm">No remarks yet</p>;
                  }
                  
                  return allRemarks.map((remark, index) => {
                    const getCategoryStyle = (category: string) => {
                      switch (category) {
                        case 'creator':
                          return 'bg-blue-50 border-l-4 border-blue-400';
                        case 'assignee':
                          return 'bg-green-50 border-l-4 border-green-400';
                        case 'general':
                          return 'bg-gray-50 border-l-4 border-gray-400';
                        default:
                          return 'bg-gray-50 border-l-4 border-gray-400';
                      }
                    };
                    
                    const getCategoryLabel = (category: string) => {
                      switch (category) {
                        case 'creator':
                          return 'Creator';
                        case 'assignee':
                          return 'Assignee';
                        case 'general':
                          return 'General';
                        default:
                          return 'General';
                      }
                    };
                    
                    return (
                      <div key={`${remark.category}-${index}`} className={`p-3 rounded-r-md ${getCategoryStyle(remark.category)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-800">{remark.text}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                By {remark.author?.name} • {new Date(remark.createdAt).toLocaleString()}
                              </p>
                              <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                                {getCategoryLabel(remark.category)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FaUser className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created by</p>
                    <p className="text-sm text-gray-900">{task.createdBy?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FaBuilding className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Department</p>
                    <p className="text-sm text-gray-900">{task.department?.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <FaClock className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Users */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <FaUsers className="inline mr-2" />
                Assigned Users
              </h2>
              
              <div className="space-y-2">
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  task.assignedTo.map((assignment, index) => (
                    <div key={`${assignment.user._id}-${index}`} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{assignment.user.name}</p>
                        <p className="text-xs text-gray-500">{assignment.user.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No users assigned</p>
                )}
              </div>
            </div>

            {/* Overviewer Info */}
            <div className="bg-blue-50 rounded-lg shadow border border-blue-200 p-4 sm:p-6">
              <h2 className="text-lg font-medium text-blue-900 mb-4">
                <FaEye className="inline mr-2" />
                Your Overviewer Access
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <p className="text-blue-800">Full read access to task details</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <p className="text-blue-800">View all attachments and documents</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <p className="text-blue-800">Access to remarks and comments</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <p className="text-blue-800">Real-time status and progress updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewerTaskDetail;