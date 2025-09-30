import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import taskService from '../services/taskService';
import userService from '../services/userService';

interface CreateTaskFormData {
  title: string;
  description: string;
  taskType: 'individual' | 'group';
  assignedTo: string[];
  priority: 'urgent' | 'medium' | 'normal';
  deadline: string;
  startDate: string;
  attachments: File[];
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    taskType: 'individual',
    assignedTo: [],
    priority: 'normal',
    deadline: '',
    startDate: '',
    attachments: [],
  });

  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Load available users on component mount
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  // Auto-detect task type based on number of assigned users
  useEffect(() => {
    const newTaskType = formData.assignedTo.length > 1 ? 'group' : 'individual';
    if (formData.taskType !== newTaskType) {
      setFormData(prev => ({ ...prev, taskType: newTaskType }));
    }
  }, [formData.assignedTo]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserDropdown]);

  const loadAvailableUsers = async () => {
    try {
      const response = await userService.getUsersForDropdown();
      if (response.success) {
        const currentUser = authService.getCurrentUser();
        // Filter out the current user from the available users list
        const filteredUsers = response.data.users.filter((user: any) => 
          !currentUser || user._id !== currentUser._id
        );
        setAvailableUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load available users');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelection = (user: any) => {
    const isAlreadySelected = formData.assignedTo.includes(user._id);
    
    if (isAlreadySelected) {
      // Remove user
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.filter(id => id !== user._id)
      }));
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      // Add user
      setFormData(prev => ({
        ...prev,
        assignedTo: [...prev.assignedTo, user._id]
      }));
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const removeSelectedUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.filter(id => id !== userId)
    }));
    setSelectedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        toast.error('Task title is required');
        setLoading(false);
        return;
      }

      if (!formData.description.trim()) {
        toast.error('Task description is required');
        setLoading(false);
        return;
      }

      if (formData.assignedTo.length === 0) {
        toast.error('Please select at least one worker');
        setLoading(false);
        return;
      }

      if (!formData.deadline) {
        toast.error('Please select a deadline');
        setLoading(false);
        return;
      }

      // Create the task using the API
      const isGroupTask = formData.assignedTo.length > 1;
      const createTaskData = {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedTo: formData.assignedTo,
        attachments: formData.attachments,
        isGroupTask: isGroupTask
      };

      console.log('Creating task with data:', createTaskData);
      console.log('Task type:', formData.taskType);
      console.log('Assigned users count:', formData.assignedTo.length);
      console.log('Is group task (calculated directly):', isGroupTask);
      console.log('Is group task (formData.taskType === "group"):', formData.taskType === 'group');
      console.log('Full formData:', formData);

      const response = await taskService.createTask(createTaskData);

      if (response.success) {
        toast.success('Task created successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Failed to create task');
      }
    } catch (error: any) {
      console.error('Task creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Task creation failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // Implement save draft functionality
    toast.info('Draft saved successfully');
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      authService.logout();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 relative" style={{ width: '1440px', height: '2664px' }}>
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 w-full h-16 bg-white shadow-sm flex items-center px-8">
        <div className="flex items-center space-x-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-xl font-medium text-black hover:text-blue-600 transition-colors"
          >
            Dashboard
          </button>
          <span className="text-xl font-medium text-blue-600">Task</span>
          <span className="text-xl font-medium text-black hover:text-blue-600 transition-colors cursor-pointer">Report</span>
          <span className="text-xl font-medium text-black hover:text-blue-600 transition-colors cursor-pointer">Setting</span>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-black">Admin</div>
            <div className="text-xs text-gray-500">admin@gmail.com</div>
          </div>
          <div className="relative group">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="absolute left-32 top-48 text-2xl font-light text-blue-600">
        Dashboard / Tasks / Create Task
      </div>

      {/* Main Title */}
      <div className="absolute left-32 top-80 text-5xl font-medium text-black">
        Create New Task
      </div>

      <form onSubmit={handleSubmit}>
        {/* Main Form Container */}
        <div className="absolute left-32 top-120 w-full max-w-6xl">
          {/* Brief Info Section */}
          <div className="mb-8">
            <h3 className="text-3xl font-medium text-black mb-6">Brief Info</h3>

            {/* Task Title */}
            <div className="mb-6">
              <label className="block text-xl font-normal text-gray-600 mb-2">Task Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                className="w-full h-24 px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-xl"
                required
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-xl font-normal text-gray-600 mb-2">Description</label>
              <div className="relative">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write task details........"
                  className="w-full h-32 px-4 py-2 bg-gray-100 border border-gray-400 rounded-t-lg text-lg resize-none"
                  required
                />
                <div className="absolute top-20 left-4 flex space-x-4">
                  <button type="button" className="text-black text-lg">B</button>
                  <button type="button" className="italic text-black text-lg">I</button>
                  <button type="button" className="underline text-black text-lg">U</button>
                  <button type="button" className="text-black text-lg">S</button>
                  <button type="button" className="text-black text-lg">A</button>
                  <button type="button" className="text-black text-lg">L</button>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="mb-8">
            <h3 className="text-3xl font-medium text-black mb-6">Assignment</h3>

            {/* Task Type */}
            <div className="mb-6">
              <label className="block text-2xl font-normal text-gray-700 mb-4">
                Task Type 
                <span className="text-sm text-gray-500 ml-2">
                  (Automatically detected based on assigned workers)
                </span>
              </label>
              <div className="flex">
                <div
                  className={`flex items-center h-24 w-60 border border-gray-400 rounded-l-lg px-4 ${
                    formData.taskType === 'individual' 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span className="text-xl">Individual</span>
                  {formData.taskType === 'individual' && (
                    <span className="ml-2 text-sm">({formData.assignedTo.length} worker)</span>
                  )}
                </div>
                <div
                  className={`flex items-center h-24 w-64 border border-gray-400 rounded-r-lg px-4 ${
                    formData.taskType === 'group' 
                      ? 'bg-blue-100 border-blue-500 text-blue-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span className="text-xl">Group</span>
                  {formData.taskType === 'group' && (
                    <span className="ml-2 text-sm">({formData.assignedTo.length} workers)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Workers Selection */}
            <div className="mb-6">
              <label className="block text-2xl font-normal text-blue-600 mb-4">
                Workers {formData.assignedTo.length > 0 && `(${formData.assignedTo.length} selected)`}
              </label>
              
              {/* Selected Users Display */}
              {selectedUsers.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 mb-2">Selected Workers:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <div key={user._id} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        <span>{user.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedUser(user._id)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Selection Dropdown */}
              <div className="relative user-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="w-full h-24 px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-xl text-left flex items-center justify-between"
                >
                  <span className={selectedUsers.length > 0 ? "text-gray-800" : "text-gray-400"}>
                    {selectedUsers.length > 0 
                      ? `${selectedUsers.length} worker${selectedUsers.length > 1 ? 's' : ''} selected` 
                      : "Select Workers"
                    }
                  </span>
                  <svg 
                    className={`w-4 h-2 text-black transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <div className="p-4 text-gray-500 text-center">No users available</div>
                    ) : (
                      availableUsers.map(user => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleUserSelection(user)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            formData.assignedTo.includes(user._id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              <div className="text-xs text-gray-400">{user.department.name}</div>
                            </div>
                            {formData.assignedTo.includes(user._id) && (
                              <div className="text-blue-600">✓</div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Task Type Indication */}
              {formData.assignedTo.length > 0 && (
                <div className="mt-2 text-sm">
                  {formData.taskType === 'group' ? (
                    <div className="text-blue-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                      </svg>
                      This will be created as a <strong>group task</strong> where each member can track their individual progress
                    </div>
                  ) : (
                    <div className="text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                      This will be created as an <strong>individual task</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="mb-8">
            <h3 className="text-3xl font-medium text-black mb-6">Settings</h3>

            {/* Priority */}
            <div className="mb-6">
              <label className="block text-3xl font-normal text-gray-700 mb-4">Priority</label>
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className={`w-11 h-11 rounded-full border-2 ${formData.priority === 'urgent' ? 'border-red-500' : 'border-black'}`}>
                    {formData.priority === 'urgent' && <div className="w-7 h-7 bg-red-500 rounded-full m-1"></div>}
                  </div>
                  <span className="text-2xl text-gray-700">Urgent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-11 h-11 rounded-full border-2 ${formData.priority === 'medium' ? 'border-black' : 'border-black'}`}>
                    {formData.priority === 'medium' && <div className="w-7 h-7 bg-black rounded-full m-1"></div>}
                  </div>
                  <span className="text-2xl text-gray-700">Medium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-11 h-11 rounded-full border-2 ${formData.priority === 'normal' ? 'border-black' : 'border-black'}`}>
                    {formData.priority === 'normal' && <div className="w-7 h-7 bg-black rounded-full m-1"></div>}
                  </div>
                  <span className="text-2xl text-gray-700">Normal</span>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="mb-6">
              <label className="block text-3xl font-normal text-gray-700 mb-4">Attachments</label>
              <div className="w-1/2 h-48 border-2 border-dashed border-blue-800 rounded-lg flex flex-col items-center justify-center">
                <div className="text-center">
                  <svg className="w-7 h-7 mx-auto mb-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-lg text-black">Drop here files or browse files</p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
                >
                  Browse Files
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="absolute left-96 top-320 w-96">
          <h3 className="text-3xl font-medium text-black mb-6">Timeline</h3>

          {/* Deadline */}
          <div className="mb-6">
            <label className="block text-2xl font-normal text-red-500 mb-4">Deadline</label>
            <input
              type="text"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              placeholder="Select Date"
              className="w-full h-24 px-4 py-2 bg-gray-100 border border-gray-400 rounded-lg text-xl text-gray-500"
            />
          </div>

          {/* Start Date */}
          <div className="mb-6">
            <label className="block text-2xl font-normal text-black mb-4">Start Date</label>
            <input
              type="text"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              placeholder="12/09/2025"
              className="w-full h-24 px-4 py-2 bg-blue-50 border border-blue-500 rounded-lg text-xl text-gray-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-32 left-32 flex space-x-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-56 h-18 border-2 border-gray-500 rounded-lg text-xl font-medium text-black hover:bg-gray-50"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-56 h-18 bg-gradient-to-r from-blue-600 to-blue-900 rounded-lg text-xl font-medium text-white hover:from-blue-700 hover:to-blue-950 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Assign Task'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="w-56 h-18 border-2 border-gray-500 rounded-lg text-xl font-medium text-black hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTask;
