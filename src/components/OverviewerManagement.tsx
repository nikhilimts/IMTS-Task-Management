import React, { useState, useEffect } from 'react';
import { FaEye, FaUser, FaPlus, FaTimes, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import taskService, { type Task } from '../services/taskService';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface OverviewerManagementProps {
  task: Task;
  onTaskUpdate?: (updatedTask: Task) => void;
}

const OverviewerManagement: React.FC<OverviewerManagementProps> = ({
  task,
  onTaskUpdate
}) => {
  console.log('OverviewerManagement - task.overviewers:', task.overviewers);
  
  const [overviewerDetails, setOverviewerDetails] = useState<{[key: string]: User}>({});
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (detailsLoaded) return; // Prevent re-fetching if already loaded
    
    try {
      const response = await api.get('/users/dropdown');
      if (response.data.success && Array.isArray(response.data.data)) {
        // Build a comprehensive user details map
        const userDetailsMap: {[key: string]: User} = {};
        const users = response.data.data;
        
        users.forEach((user: User) => {
          userDetailsMap[user._id] = user;
        });
        
        setAllUsers(users);
        
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
    }
  };

  const handleAddOverviewer = async (userId: string) => {
    if (!task._id) return;
    
    try {
      setLoading(true);
      const response = await taskService.addOverviewer(task._id, { userId });
      
      if (response.success) {
        toast.success('Overviewer added successfully');
        setShowAddDialog(false);
        setSearchTerm('');
        if (onTaskUpdate) {
          onTaskUpdate(response.data.task);
        }
      }
    } catch (error: any) {
      console.error('Error adding overviewer:', error);
      toast.error(error.response?.data?.message || 'Failed to add overviewer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOverviewer = async (userId: string) => {
    if (!task._id) return;
    
    try {
      setLoading(true);
      const response = await taskService.removeOverviewer(task._id, { userId });
      
      if (response.success) {
        toast.success('Overviewer removed successfully');
        if (onTaskUpdate) {
          onTaskUpdate(response.data.task);
        }
      }
    } catch (error: any) {
      console.error('Error removing overviewer:', error);
      toast.error(error.response?.data?.message || 'Failed to remove overviewer');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const isAlreadyOverviewer = task.overviewers?.some(ov => {
      const userId = typeof ov.user === 'string' ? ov.user : ov.user?._id;
      return userId === user._id;
    });
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return !isAlreadyOverviewer && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
        <button
          onClick={() => setShowAddDialog(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
        >
          <FaPlus size={12} />
          Add Overviewer
        </button>
      </div>

      {/* Add Overviewer Dialog */}
      {showAddDialog && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Add Overviewer</h3>
            <button
              onClick={() => {
                setShowAddDialog(false);
                setSearchTerm('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={14} />
            </button>
          </div>
          
          <div className="relative mb-3">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-white cursor-pointer"
                  onClick={() => handleAddOverviewer(user._id)}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-blue-600" size={12} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <button
                    disabled={loading}
                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                {searchTerm ? 'No users found matching your search' : 'No available users to add'}
              </p>
            )}
          </div>
        </div>
      )}

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
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
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
                <button
                  onClick={() => handleRemoveOverviewer(userId)}
                  disabled={loading}
                  className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <FaTimes size={10} />
                  Remove
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaEye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm">No overviewers assigned to this task</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Overviewer" to assign users</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewerManagement;