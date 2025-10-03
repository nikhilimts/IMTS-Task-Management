import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaSave, FaTimes, FaUser, FaBuilding, FaSearch
} from 'react-icons/fa';
import taskService from '../services/taskService';
import authService from '../services/authService';
import api from '../services/api';
import type { CreateTaskData } from '../services/taskService';
import NotificationBell from '../components/NotificationBell';

interface User {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  displayName: string;
  searchableText: string;
}

interface AssignedUser {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  assignedAt: Date;
}

const TaskCreate: React.FC = () => {
  const navigate = useNavigate();

  // States
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AssignedUser[]>([]);

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

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Load initial data
  useEffect(() => {
    loadUsersAndDepartments();
  }, []);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim()) {
      const currentUser = authService.getCurrentUser();
      const filtered = users.filter(user => {
        // Exclude current user from the dropdown
        const isCurrentUser = currentUser && user._id === currentUser._id;
        return !isCurrentUser && user.searchableText.toLowerCase().includes(userSearch.toLowerCase());
      });
      setFilteredUsers(filtered.slice(0, 10)); // Limit to 10 results
    } else {
      setFilteredUsers([]);
    }
  }, [userSearch, users]);

  const loadUsersAndDepartments = async () => {
    try {
      const usersResponse = await api.get('/users/dropdown');

      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load users');
    }
  };

  const handleInputChange = (field: keyof CreateTaskData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUserSelect = (user: User) => {
    const isAlreadyAssigned = selectedUsers.some(
      assignment => assignment.user._id === user._id
    );

    if (!isAlreadyAssigned) {
      const newAssignment: AssignedUser = {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        assignedAt: new Date()
      };

      setSelectedUsers(prev => [...prev, newAssignment]);
      setFormData(prev => ({
        ...prev,
        assignedTo: [...(prev.assignedTo || []), user._id]
      }));
    }

    setUserSearch('');
    setShowUserDropdown(false);
  };

  const removeAssignedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(assignment => assignment.user._id !== userId));
    setFormData(prev => ({
      ...prev,
      assignedTo: (prev.assignedTo || []).filter(id => id !== userId)
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Task description is required');
      return;
    }

    if ((formData.assignedTo || []).length === 0) {
      toast.error('Please assign the task to at least one user');
      return;
    }

    setSaving(true);

    try {
      // Create task data
      const taskData: CreateTaskData = {
        ...formData,
        attachments: selectedFiles
      };

      console.log('Creating task with data:', taskData);

      const response = await taskService.createTask(taskData);
      
      if (response.success) {
        toast.success('Task created successfully!');
        navigate(`/tasks/${response.data.task._id}`);
      } else {
        toast.error('Failed to create task');
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Tasks"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
                <p className="text-gray-600 mt-1">Fill in the details to create a new task</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaSave className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Title */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                  required
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the task in detail..."
                  required
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tags */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={(formData.tags || []).join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="urgent, frontend, bug-fix"
                />
              </div>
            </div>
          </div>

          {/* User Assignment */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Users</h2>
            
            {/* User Search */}
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search and Add Users *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search by name or email..."
                />
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>

              {/* Dropdown */}
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      type="button"
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
                    >
                      <FaUser className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span>{user.email}</span>
                          <span>•</span>
                          <span className="flex items-center">
                            <FaBuilding className="w-3 h-3 mr-1" />
                            {user.department}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Click outside to close dropdown */}
            {showUserDropdown && (
              <div
                className="fixed inset-0 z-5"
                onClick={() => setShowUserDropdown(false)}
              />
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Users ({selectedUsers.length})
                </label>
                <div className="space-y-2">
                  {selectedUsers.map((assignment) => (
                    <div
                      key={assignment.user?._id || 'unknown'}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FaUser className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {assignment.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.user?.email || 'Unknown Email'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAssignedUser(assignment.user._id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                        title="Remove user"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              />
              
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskCreate;