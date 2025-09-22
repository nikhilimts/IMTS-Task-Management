import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaSave, FaDownload, FaUsers, FaClock, FaTimes,
  FaFileUpload, FaCalendarAlt, FaUser, FaBuilding, FaEye, FaFilePdf, FaImage, FaFile, FaPlus
} from 'react-icons/fa';
import taskService from '../services/taskService';
import authService from '../services/authService';
import api from '../services/api';
import type { Task, CreateTaskData, RemarkData } from '../services/taskService';
import NotificationBell from '../components/NotificationBell';
import OverviewerManagement from '../components/OverviewerManagement';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = id === 'new';
  
  console.log('TaskDetail component loaded. ID:', id, 'isCreateMode:', isCreateMode);
  
  // States
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const currentUser = authService.getCurrentUser();

  // Permission checks based on user role (only for existing tasks)
  const isCreator = !isCreateMode && task?.createdBy?._id === currentUser?._id;
  const isAssignee = !isCreateMode && task?.assignedTo?.some(assignment => assignment.user._id === currentUser?._id);
  const canUpdateStatus = isCreateMode || isCreator; // Allow in create mode or if creator
  const canUpdateStage = isCreateMode || isAssignee; // Allow in create mode or if assignee

  // Form data
  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    assignedTo: [],
    tags: [],
    attachments: []
  });

  // Debug logging
  console.log('Create mode debug:', {
    isCreateMode,
    formDataTitle: formData.title
  });

  // Remark states
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);

  // File upload states
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const loadInitialData = async () => {
    try {
      // Load users and departments
      const [usersResponse] = await Promise.all([
        api.get('/users')
      ]);

      if (usersResponse.data && usersResponse.data.success) {
        setUsers(usersResponse.data.data || []);
      }

      // Load task if not in create mode
      if (!isCreateMode && id) {
        console.log('Attempting to load task with ID:', id);
        try {
          const taskResponse = await taskService.getTask(id);
          console.log('Raw task response:', taskResponse);
          
          if (taskResponse && taskResponse.success && taskResponse.data && taskResponse.data.task) {
            console.log('Setting task data:', taskResponse.data.task);
            setTask(taskResponse.data.task);
            setFormData({
              title: taskResponse.data.task.title,
              description: taskResponse.data.task.description,
              deadline: new Date(taskResponse.data.task.deadline).toISOString().slice(0, 16),
              priority: taskResponse.data.task.priority,
              assignedTo: taskResponse.data.task.assignedTo.map(a => a.user._id),
              tags: taskResponse.data.task.tags || [],
              attachments: []
            });
            console.log('Task set successfully');
          } else {
            console.error('Invalid task response structure:', taskResponse);
            toast.error('Invalid response from server');
          }
        } catch (taskError) {
          console.error('Error fetching task:', taskError);
          toast.error('Failed to load task details');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Redirect to group page if task is group
  useEffect(() => {
    if (!isCreateMode && task?.isGroupTask && id) {
      navigate(`/tasks/${id}/group`, { replace: true });
    }
  }, [task?.isGroupTask, id, isCreateMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignedUsersChange = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo?.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...(prev.assignedTo || []), userId]
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setFormData(prev => ({ ...prev, attachments: files }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!formData.deadline) {
        toast.error('Task deadline is required');
        return;
      }

      if (isCreateMode) {
        if (!formData.title.trim()) {
          toast.error('Task title is required');
          return;
        }

        if (!formData.description.trim()) {
          toast.error('Task description is required');
          return;
        }

        const response = await taskService.createTask(formData);
        if (response.success) {
          toast.success('Task created successfully');
          navigate(`/tasks/${response.data.task._id}`);
        }
      } else if (id && isCreator) {
        // For existing tasks, only allow deadline updates by creators
        const response = await taskService.updateTask(id, {
          deadline: formData.deadline
        });
        if (response.success) {
          toast.success('Task deadline updated successfully');
          setTask(response.data.task);
          loadInitialData();
        }
      } else {
        toast.error('You do not have permission to update this task');
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    
    try {
      const response = await taskService.updateTaskStatus(id, {
        status: newStatus as any,
        reason: `Status changed to ${newStatus}`
      });
      if (response.success) {
        toast.success('Status updated successfully');
        setTask(response.data.task);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!id) return;
    
    try {
      const response = await taskService.updateTaskStage(id, {
        stage: newStage as any,
        reason: `Stage changed to ${newStage}`
      });
      if (response.success) {
        toast.success('Stage updated successfully');
        setTask(response.data.task);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update stage');
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !id) return;

    try {
      setAddingRemark(true);
      
      const remarkData: RemarkData = {
        text: newRemark,
        category: 'auto' as const // Let backend automatically determine the category
      };
      
      const response = await taskService.addRemark(id, remarkData);
      if (response.success) {
        toast.success('Remark added successfully');
        setTask(response.data.task);
        setNewRemark('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add remark');
    } finally {
      setAddingRemark(false);
    }
  };

  const handleAssignTask = async () => {
    if (!id || !formData.assignedTo?.length) return;

    try {
      const response = await taskService.assignTask(id, {
        userIds: formData.assignedTo,
        reason: 'Task assignment updated'
      });
      if (response.success) {
        toast.success('Task assigned successfully');
        setTask(response.data.task);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles.length || !id) return;

    try {
      setUploadingFiles(true);
      const response = await taskService.addAttachments(id, selectedFiles);
      if (response.success) {
        toast.success('Files uploaded successfully');
        setSelectedFiles([]);
        loadInitialData(); // Reload to get updated attachments
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!id) return;

    try {
      const response = await taskService.removeAttachment(id, attachmentId);
      if (response.success) {
        toast.success('Attachment removed successfully');
        loadInitialData(); // Reload to get updated attachments
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove attachment');
    }
  };

  const handleViewFile = (taskId: string, attachmentId: string) => {
    // Use browser's native viewer for PDFs and images with public view endpoint
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
                {isCreateMode ? 'Create New Task' : task?.title || 'Task Details'}
              </h1>
              {/* Permission Indicator */}
              {!isCreateMode && task && (
                <div className="flex items-center space-x-2">
                  {isCreator && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Creator - Can update status
                    </span>
                  )}
                  {isAssignee && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Assignee - Can update stage
                    </span>
                  )}
                  {!isCreator && !isAssignee && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Viewer - Read only
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <NotificationBell />
              {!isCreateMode && (
                <div className="text-sm text-gray-500">
                  View task details
                </div>
              )}
              
              {isCreateMode && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <FaPlus className="mr-2" />
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  {isCreateMode ? (
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter task title"
                    />
                  ) : (
                    <p className="text-gray-900">{task?.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  {isCreateMode ? (
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter task description"
                    />
                  ) : (
                    <p className="text-gray-900 whitespace-pre-wrap">{task?.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    {isCreateMode ? (
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task?.priority || '')}`}>
                        {task?.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Not set'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline * {!isCreateMode && isCreator && (
                        <span className="text-xs text-blue-600">(You can edit this)</span>
                      )}
                    </label>
                    
                    {(isCreateMode || isCreator) ? (
                      <div className="flex gap-2">
                        <input
                          type="datetime-local"
                          name="deadline"
                          value={formData.deadline}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {!isCreateMode && isCreator && (
                          <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                          >
                            <FaSave />
                            Save
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {task?.deadline ? new Date(task.deadline).toLocaleString() : 'Not set'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  {isCreateMode ? (
                    <input
                      type="text"
                      value={formData.tags?.join(', ') || ''}
                      onChange={handleTagsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter tags separated by commas"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {task?.tags?.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                      {(!task?.tags || task.tags.length === 0) && (
                        <span className="text-gray-500 text-sm">No tags</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Stage Management (only for existing tasks) */}
            {!isCreateMode && task && (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Progress</h2>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                      {!canUpdateStatus && (
                        <span className="text-xs text-gray-500 ml-2">(Creator only)</span>
                      )}
                    </label>
                    {canUpdateStatus ? (
                      <select
                        value={task.status === 'approved' || task.status === 'rejected' ? task.status : 'pending'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    ) : (
                      <div className={`w-full px-3 py-2 border border-gray-200 rounded-md ${getStatusColor(task.status)} opacity-75 cursor-not-allowed`}>
                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </div>
                    )}
                  </div>

                  {/* Completion Notice waiting for approval */}
                  {task.stage === 'done' && !['approved', 'rejected'].includes(task.status) && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 10.793a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="text-blue-800 font-medium">Task Completed - Awaiting Review</p>
                          <p className="text-blue-700">The assignee has marked this task as done. Creator can now approve or reject.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Notice for Rework */}
                  {task.status === 'rejected' && (isCreator || isAssignee) && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm">
                          <p className="text-red-800 font-medium">Task Rejected</p>
                          <p className="text-red-700">The stage has been reset to "Pending". Please rework and mark as "Done" again.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage
                      {!canUpdateStage && (
                        <span className="text-xs text-gray-500 ml-2">(Assignee only)</span>
                      )}
                    </label>
                    {canUpdateStage ? (
                      <select
                        value={task.stage}
                        onChange={(e) => handleStageChange(e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStageColor(task.stage)}`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="pending">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    ) : (
                      <div className={`w-full px-3 py-2 border border-gray-200 rounded-md ${getStageColor(task.stage)} opacity-75 cursor-not-allowed`}>
                        {task.stage.charAt(0).toUpperCase() + task.stage.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Attachments</h2>
              
              {/* File Upload */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <FaFileUpload className="mr-2" />
                    Choose Files
                  </label>
                  {selectedFiles.length > 0 && (
                    <button
                      onClick={handleFileUpload}
                      disabled={uploadingFiles}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploadingFiles ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                    </button>
                  )}
                </div>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Existing Attachments */}
              {task?.attachments && task.attachments.length > 0 ? (
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
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
                        <button
                          onClick={() => handleDeleteAttachment(attachment._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No attachments</p>
              )}
            </div>

            {/* Remarks Section (only for existing tasks) */}
            {!isCreateMode && task && (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Remarks & Comments</h2>
                
                {/* Add New Remark */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newRemark}
                        onChange={(e) => setNewRemark(e.target.value)}
                        placeholder="Add a remark or comment..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddRemark}
                          disabled={!newRemark.trim() || addingRemark}
                          className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addingRemark ? 'Adding...' : 'Add Remark'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Existing Remarks */}
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
                      // Get styling based on category
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            {!isCreateMode && task && (
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
            )}

            {/* Assigned Users */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <FaUsers className="inline mr-2" />
                Assigned Users
              </h2>
              
              {isCreateMode ? (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users by name or department..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setShowUserDropdown(e.target.value.length > 0);
                      }}
                      onFocus={() => setShowUserDropdown(userSearch.length > 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Dropdown with filtered users */}
                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {users
                          .filter(user => 
                            user.role !== 'admin' && 
                            (user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                             user.email.toLowerCase().includes(userSearch.toLowerCase()))
                          )
                          .map((user) => (
                            <div
                              key={user._id}
                              onClick={() => {
                                handleAssignedUsersChange(user._id);
                                setUserSearch('');
                                setShowUserDropdown(false);
                              }}
                              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={formData.assignedTo?.includes(user._id) || false}
                                  onChange={() => handleAssignedUsersChange(user._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {user.email} • {user.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        }
                        {users.filter(user => 
                          user.role !== 'admin' && 
                          (user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                           user.email.toLowerCase().includes(userSearch.toLowerCase()))
                        ).length === 0 && (
                          <div className="p-3 text-gray-500 text-sm">No users found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Users Display */}
                  {formData.assignedTo && formData.assignedTo.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Users:</p>
                      {formData.assignedTo.map((userId) => {
                        const user = users.find(u => u._id === userId);
                        return user ? (
                          <div key={userId} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">
                                {user.email} • {user.role}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAssignedUsersChange(userId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {!isCreateMode && (
                    <button
                      onClick={handleAssignTask}
                      className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Update Assignment
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {task?.assignedTo && task.assignedTo.length > 0 ? (
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
              )}
            </div>

            {/* Overviewer Management - Only show for existing tasks */}
            {!isCreateMode && task && (
              <OverviewerManagement 
                task={task}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default TaskDetail;
