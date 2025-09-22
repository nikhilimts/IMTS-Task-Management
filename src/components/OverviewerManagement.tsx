import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FaEye, FaPlus, FaTimes, FaUser, FaUsers, FaCheck
} from 'react-icons/fa';
import taskService from '../services/taskService';
import api from '../services/api';
import type { Task } from '../services/taskService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface OverviewerManagementProps {
  task: Task;
  onTaskUpdate: (updatedTask: Task) => void;
  currentUserId: string;
  canManageOverviewers: boolean;
}

const OverviewerManagement: React.FC<OverviewerManagementProps> = ({
  task,
  onTaskUpdate,
  currentUserId,
  canManageOverviewers
}) => {
  console.log('OverviewerManagement - task.overviewers:', task.overviewers);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');
  const [overviewerDetails, setOverviewerDetails] = useState<{[key: string]: User}>({});
  const [detailsLoaded, setDetailsLoaded] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (detailsLoaded) return; // Prevent re-fetching if already loaded
    
    try {
      setUsersLoading(true);
      const response = await api.get('/users/dropdown');
      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
        
        // Build a comprehensive user details map
        const userDetailsMap: {[key: string]: User} = {};
        response.data.data.forEach((user: User) => {
          userDetailsMap[user._id] = user;
        });
        
        // Also include any existing user data from task.overviewers
        if (task.overviewers) {
          task.overviewers.forEach(overviewer => {
            if (overviewer.user && typeof overviewer.user !== 'string' && overviewer.user.name) {
              userDetailsMap[overviewer.user._id] = overviewer.user;
            }
            if (overviewer.addedBy && typeof overviewer.addedBy !== 'string' && overviewer.addedBy.name) {
              userDetailsMap[overviewer.addedBy._id] = overviewer.addedBy;
            }
          });
        }
        
        setOverviewerDetails(userDetailsMap);
        setDetailsLoaded(true);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddOverviewer = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setLoading(true);
    try {
      const response = await taskService.addOverviewer(task._id, {
        userId: selectedUser,
        permissions: {
          canViewDetails: true,
          canViewAttachments: true,
          canViewRemarks: true,
          canViewProgress: true
        }
      });

      if (response.success) {
        onTaskUpdate(response.data.task);
        toast.success('Overviewer added successfully');
        setShowAddModal(false);
        setSelectedUser('');
        setUserSearch('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add overviewer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverviewer = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this overviewer?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await taskService.removeOverviewer(task._id, { userId });
      if (response.success) {
        onTaskUpdate(response.data.task);
        toast.success('Overviewer removed successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove overviewer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter users for search
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filter out users who are already overviewers, creators, or assignees
  const availableUsers = filteredUsers.filter(user => {
    const isCreator = task.createdBy?._id === user._id;
    const isAssignee = task.assignedTo?.some(assignment => assignment.user._id === user._id);
    const isOverviewer = task.overviewers?.some(overviewer => overviewer.user._id === user._id);
    const isCurrentUser = currentUserId === user._id;
    
    return !isCreator && !isAssignee && !isOverviewer && !isCurrentUser;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FaEye className="mr-2 text-blue-600" />
          Task Overviewers
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({task.overviewers?.length || 0})
          </span>
        </h2>
        {canManageOverviewers && (
          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FaPlus className="mr-2" size={14} />
            Add Overviewer
          </button>
        )}
      </div>

      {/* Overviewer List */}
      <div className="space-y-3">
        {task.overviewers && task.overviewers.length > 0 ? (
          task.overviewers.map((overviewer) => {
            // Get user info from our details map or fallback to what's in the overviewer
            const userId = typeof overviewer.user === 'string' ? overviewer.user : overviewer.user?._id;
            const userInfo = overviewerDetails[userId] || overviewer.user;
            
            let userName = 'Unknown User';
            let userEmail = 'No email';
            
            if (typeof userInfo === 'object' && userInfo) {
              userName = userInfo.name || 'Unknown User';
              userEmail = userInfo.email || 'No email';
            } else if (!detailsLoaded) {
              userName = 'Loading...';
              userEmail = 'Loading...';
            }
            
            // Handle addedBy information
            let addedBy = 'Unknown';
            if (typeof overviewer.addedBy === 'string') {
              const addedByUser = overviewerDetails[overviewer.addedBy];
              addedBy = addedByUser?.name || `User ${(overviewer.addedBy as string).slice(-8)}`;
            } else if (overviewer.addedBy?.name) {
              addedBy = overviewer.addedBy.name;
            }
            
            const addedAt = overviewer.addedAt;
            
            console.log('Rendering overviewer:', {
              userId,
              userName,
              userEmail,
              addedBy,
              detailsLoaded,
              userInfo
            });
            
            return (
              <div
                key={userId}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{userName}</h4>
                    <p className="text-sm text-gray-600">{userEmail}</p>
                    <p className="text-xs text-gray-500">
                      Added by {addedBy} on {formatDate(addedAt)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Access: Full Access (All Permissions)
                    </p>
                  </div>
                </div>

                {canManageOverviewers && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRemoveOverviewer(userId)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Overviewer"
                      disabled={loading}
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaUsers className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm">No overviewers assigned to this task</p>
            {canManageOverviewers && (
              <p className="text-xs mt-1">Click "Add Overviewer" to assign someone to view this task</p>
            )}
          </div>
        )}
      </div>

      {/* Add Overviewer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Overviewer</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUser('');
                    setUserSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Users
                  </label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  {usersLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                      {availableUsers.length > 0 ? (
                        availableUsers.map((user) => (
                          <div
                            key={user._id}
                            onClick={() => setSelectedUser(user._id)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-200 last:border-b-0 ${
                              selectedUser === user._id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                                <p className="text-xs text-gray-400">{user.role}</p>
                              </div>
                              {selectedUser === user._id && (
                                <FaCheck className="text-blue-600" size={16} />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {userSearch ? 'No users found matching your search' : 'No available users to add as overviewers'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Permissions Info */}
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Overviewer Permissions</h4>
                  <p className="text-xs text-blue-700">
                    Overviewers will automatically receive full access to view all task details, 
                    attachments, remarks, and progress. They cannot edit the task.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUser('');
                    setUserSearch('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOverviewer}
                  disabled={!selectedUser || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Overviewer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewerManagement;