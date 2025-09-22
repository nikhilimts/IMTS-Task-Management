import React, { useState, useEffect } from 'react';
import { FaEye, FaUser } from 'react-icons/fa';
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
}

const OverviewerManagement: React.FC<OverviewerManagementProps> = ({
  task
}) => {
  console.log('OverviewerManagement - task.overviewers:', task.overviewers);
  
  const [overviewerDetails, setOverviewerDetails] = useState<{[key: string]: User}>({});
  const [detailsLoaded, setDetailsLoaded] = useState(false);

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
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 flex items-center">
          <FaEye className="mr-2 text-blue-600" />
          Task Overviewers
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({task.overviewers?.length || 0})
          </span>
        </h2>
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
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaEye className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-sm">No overviewers assigned to this task</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewerManagement;