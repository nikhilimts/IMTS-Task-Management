import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaSave, FaEdit, FaTrash, FaPlus, FaDownload, 
  FaUsers, FaClock, FaTimes,
  FaFileUpload, FaCalendarAlt, FaUser, FaBuilding, FaEye,
  FaFilePdf, FaImage, FaFile
} from 'react-icons/fa';
import taskService from '../services/taskService';
import authService from '../services/authService';
import api from '../services/api';
import type { Task, CreateTaskData, UpdateTaskData, RemarkData } from '../services/taskService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Department {
  _id: string;
  name: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isCreateMode = id === 'new';
  
  console.log('TaskDetail component loaded. ID:', id, 'isCreateMode:', isCreateMode);
  
  // States
  const [task, setTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(isCreateMode);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const currentUser = authService.getCurrentUser();

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

  // Remark states
  const [newRemark, setNewRemark] = useState('');
  const [remarkCategory, setRemarkCategory] = useState<'creator' | 'assignee' | 'general' | 'auto'>('auto');
  const [addingRemark, setAddingRemark] = useState(false);

  // File upload states
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const loadInitialData = async () => {
    try {
      // Load users and departments
      const [usersResponse, departmentsResponse] = await Promise.all([
        api.get('/users'),
        authService.getDepartments()
      ]);

      if (usersResponse.data && usersResponse.data.success) {
        setUsers(usersResponse.data.data || []);
      }
      setDepartments(departmentsResponse);

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

      if (!formData.title.trim()) {
        toast.error('Task title is required');
        return;
      }

      if (!formData.description.trim()) {
        toast.error('Task description is required');
        return;
      }

      if (!formData.deadline) {
        toast.error('Task deadline is required');
        return;
      }

      if (isCreateMode) {
        const response = await taskService.createTask(formData);
        if (response.success) {
          toast.success('Task created successfully');
          navigate(`/tasks/${response.data.task._id}`);
        }
      } else if (id) {
        const updateData: UpdateTaskData = {
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          priority: formData.priority,
          tags: formData.tags,
          attachments: formData.attachments
        };
        const response = await taskService.updateTask(id, updateData);
        if (response.success) {
          toast.success('Task updated successfully');
          setTask(response.data.task);
          setEditMode(false);
          loadInitialData();
        }
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
        category: remarkCategory
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

  const handleDeleteTask = async () => {
    if (!id || !confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await taskService.deleteTask(id);
      if (response.success) {
        toast.success('Task deleted successfully');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete task');
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
      planning: 'bg-blue-100 text-blue-800',
      development: 'bg-purple-100 text-purple-800',
      testing: 'bg-yellow-100 text-yellow-800',
      review: 'bg-orange-100 text-orange-800',
      deployment: 'bg-green-100 text-green-800',
      completed: 'bg-green-200 text-green-900',
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
      {/* Debug Info */}
      <div className="fixed top-0 left-0 bg-black text-white p-2 text-xs z-50">
        Debug: loading={loading.toString()}, isCreateMode={isCreateMode.toString()}, taskExists={!!task}, taskId={id}
      </div>
      
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
            </div>
            
            <div className="flex items-center space-x-3">
              {!isCreateMode && (
                <>
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        <FaSave className="mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <FaEdit className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteTask}
                        className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Task Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  {editMode || isCreateMode ? (
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
                  {editMode || isCreateMode ? (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority *
                    </label>
                    {editMode || isCreateMode ? (
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
                      Deadline *
                    </label>
                    {editMode || isCreateMode ? (
                      <input
                        type="datetime-local"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
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
                  {editMode || isCreateMode ? (
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
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Progress</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                    >
                      <option value="created">Created</option>
                      <option value="assigned">Assigned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage
                    </label>
                    <select
                      value={task.stage}
                      onChange={(e) => handleStageChange(e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStageColor(task.stage)}`}
                    >
                      <option value="planning">Planning</option>
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                      <option value="review">Review</option>
                      <option value="deployment">Deployment</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="bg-white rounded-lg shadow p-6">
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
                <div className="flex items-center space-x-3">
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
              <div className="bg-white rounded-lg shadow p-6">
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
                      <div className="flex items-center justify-between mt-2">
                        <select
                          value={remarkCategory}
                          onChange={(e) => setRemarkCategory(e.target.value as any)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="auto">Auto Category</option>
                          <option value="general">General</option>
                          <option value="creator">Creator</option>
                          <option value="assignee">Assignee</option>
                        </select>
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
                <div className="space-y-4">
                  {/* Creator Remarks */}
                  {task.remarks?.creator && task.remarks.creator.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Creator Remarks</h3>
                      {task.remarks.creator.map((remark, index) => (
                        <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                          <p className="text-sm text-gray-800">{remark.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {remark.author?.name} on {new Date(remark.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assignee Remarks */}
                  {task.remarks?.assignee && task.remarks.assignee.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Assignee Remarks</h3>
                      {task.remarks.assignee.map((remark, index) => (
                        <div key={index} className="p-3 bg-green-50 border-l-4 border-green-400 rounded-r-md">
                          <p className="text-sm text-gray-800">{remark.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {remark.author?.name} on {new Date(remark.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* General Remarks */}
                  {task.remarks?.general && task.remarks.general.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">General Remarks</h3>
                      {task.remarks.general.map((remark, index) => (
                        <div key={index} className="p-3 bg-gray-50 border-l-4 border-gray-400 rounded-r-md">
                          <p className="text-sm text-gray-800">{remark.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {remark.author?.name} on {new Date(remark.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!task.remarks?.creator?.length && !task.remarks?.assignee?.length && !task.remarks?.general?.length) && (
                    <p className="text-gray-500 text-sm">No remarks yet</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            {!isCreateMode && task && (
              <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                <FaUsers className="inline mr-2" />
                Assigned Users
              </h2>
              
              {editMode || isCreateMode ? (
                <div className="space-y-2">
                  {users.filter(user => user.role !== 'admin').map((user) => (
                    <label key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.assignedTo?.includes(user._id) || false}
                        onChange={() => handleAssignedUsersChange(user._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900">{user.name}</span>
                      <span className="text-xs text-gray-500">({user.role})</span>
                    </label>
                  ))}
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
          </div>
        </div>
      </div>

    </div>
  );
};

export default TaskDetail;
