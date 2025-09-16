import React, { useState } from 'react';
import { FaUsers, FaCheckCircle, FaClock, FaExclamationTriangle, FaEdit } from 'react-icons/fa';
import type { Task as TaskType } from '../services/taskService';
import taskService from '../services/taskService';
import { toast } from 'react-toastify';

interface GroupTaskViewProps {
  task: TaskType;
  currentUserId: string;
  onTaskUpdate?: (task: TaskType) => void;
}

const GroupTaskView: React.FC<GroupTaskViewProps> = ({ task, currentUserId, onTaskUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingStage, setEditingStage] = useState<string | null>(null);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'planning':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'done':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'planning':
        return <FaClock className="w-4 h-4" />;
      case 'pending':
        return <FaExclamationTriangle className="w-4 h-4" />;
      case 'done':
        return <FaCheckCircle className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const handleIndividualStageUpdate = async (newStage: string, notes?: string) => {
    try {
      setIsUpdating(true);
      
      const updateData = {
        stage: newStage as 'planning' | 'pending' | 'done',
        status: newStage === 'done' ? 'completed' as const : 'in_progress' as const,
        notes: notes || ''
      };

      const response = await taskService.updateIndividualStage(task._id, updateData);
      
      if (response.success) {
        toast.success('Your stage updated successfully');
        if (onTaskUpdate) {
          onTaskUpdate(response.data.task);
        }
      }
    } catch (error: any) {
      console.error('Failed to update individual stage:', error);
      toast.error(error.response?.data?.message || 'Failed to update stage');
    } finally {
      setIsUpdating(false);
      setEditingStage(null);
    }
  };

  const getCurrentUserAssignment = () => {
    return task.assignedTo.find(assignment => assignment.user._id === currentUserId);
  };

  const calculateProgress = () => {
    const totalAssignees = task.assignedTo.length;
    const completedAssignees = task.assignedTo.filter(
      assignment => assignment.individualStage === 'done' || assignment.status === 'completed'
    ).length;
    
    return totalAssignees > 0 ? Math.round((completedAssignees / totalAssignees) * 100) : 0;
  };

  const currentUserAssignment = getCurrentUserAssignment();
  const progress = calculateProgress();

  const handleApproval = async (userId: string, decision: 'approve' | 'reject') => {
    try {
      setIsUpdating(true);
      const res = await taskService.updateIndividualApproval(task._id, { userId, decision });
      if (res.success) {
        toast.success(decision === 'approve' ? 'Approved' : 'Rejected');
        onTaskUpdate?.(res.data.task);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update approval');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Group Task Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaUsers className="text-blue-600 w-5 h-5" />
          <span className="text-lg font-semibold text-gray-800">Group Task</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {task.assignedTo.length} members
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Overall Progress</div>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Individual Progress for Each Member */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700 mb-2">Individual Progress</h4>
        {task.assignedTo.map((assignment) => {
          const isCurrentUser = assignment.user._id === currentUserId;
          const isEditing = editingStage === assignment.user._id;
          
          return (
            <div
              key={assignment.user._id}
              className={`p-3 rounded-lg border ${
                isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {assignment.user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {assignment.user.name}
                        {isCurrentUser && <span className="text-blue-600 text-xs ml-1">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-500">{assignment.user.email}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Individual Status */}
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('_', ' ')}
                  </span>

                  {/* Approval badge */}
                  {assignment.approval && (
                    <span className={`px-2 py-1 rounded-full text-xs ${assignment.approval === 'approved' ? 'bg-green-100 text-green-800' : assignment.approval === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {assignment.approval}
                    </span>
                  )}

                  {/* Individual Stage */}
                  {isEditing ? (
                    <select
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                      defaultValue={assignment.individualStage}
                      onChange={(e) => handleIndividualStageUpdate(e.target.value)}
                      disabled={isUpdating}
                    >
                      <option value="planning">Planning</option>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded-full text-xs border flex items-center space-x-1 ${getStageColor(assignment.individualStage)}`}
                    >
                      {getStageIcon(assignment.individualStage)}
                      <span>{assignment.individualStage.charAt(0).toUpperCase() + assignment.individualStage.slice(1)}</span>
                    </span>
                  )}

                  {/* Edit Button for Current User */}
                  {isCurrentUser && !isEditing && (
                    <button
                      onClick={() => setEditingStage(assignment.user._id)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Update your stage"
                    >
                      <FaEdit className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Individual Notes */}
              {assignment.notes && (
                <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                  <strong>Notes:</strong> {assignment.notes}
                </div>
              )}

              {/* Completion Time */}
              {assignment.completedAt && (
                <div className="mt-1 text-xs text-green-600">
                  ✓ Completed on {new Date(assignment.completedAt).toLocaleDateString()}
                </div>
              )}

              {/* Moderator controls: approve/reject */}
              {task.isGroupTask && (task.createdBy?._id === currentUserId) && assignment.individualStage === 'done' && (
                <div className="mt-2 flex space-x-2">
                  {assignment.approval !== 'approved' && (
                    <button
                      onClick={() => handleApproval(assignment.user._id, 'approve')}
                      disabled={isUpdating}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleApproval(assignment.user._id, 'reject')}
                    disabled={isUpdating}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions for Current User */}
      {currentUserAssignment && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-2">Quick Actions</h5>
          <div className="flex space-x-2">
            {currentUserAssignment.individualStage !== 'done' && (
              <>
                {currentUserAssignment.individualStage === 'planning' && (
                  <button
                    onClick={() => handleIndividualStageUpdate('pending')}
                    disabled={isUpdating}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Start Working
                  </button>
                )}
                {currentUserAssignment.individualStage === 'pending' && (
                  <button
                    onClick={() => handleIndividualStageUpdate('done')}
                    disabled={isUpdating}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupTaskView;