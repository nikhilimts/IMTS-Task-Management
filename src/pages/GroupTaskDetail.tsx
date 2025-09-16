import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import taskService, { type Task } from '../services/taskService';
import GroupTaskView from '../components/GroupTaskView';

const GroupTaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  // Remark states
  const [newRemark, setNewRemark] = useState('');
  const [remarkCategory, setRemarkCategory] = useState<'creator' | 'assignee' | 'general' | 'auto'>('auto');
  const [addingRemark, setAddingRemark] = useState(false);

  // Auto-determine remark category based on user role
  const getRemarkCategory = (): 'creator' | 'assignee' | 'general' => {
    if (!currentUser || !task) return 'general';
    
    // If current user is the task creator
    if (task.createdBy._id === currentUser._id) {
      return 'creator';
    }
    
    // If current user is an assignee
    if (task.assignedTo.some(assignment => assignment.user._id === currentUser._id)) {
      return 'assignee';
    }
    
    // Otherwise general
    return 'general';
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await taskService.getTask(id);
        if (res.success) {
          if (!res.data.task.isGroupTask) {
            navigate(`/tasks/${id}`, { replace: true });
            return;
          }
          setTask(res.data.task);
        }
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleTaskUpdate = (updated: Task) => setTask(updated);

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !id) return;

    try {
      setAddingRemark(true);
      const category = remarkCategory === 'auto' ? getRemarkCategory() : remarkCategory;
      const remarkData = {
        text: newRemark,
        category
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (!task) return null;

  const total = task.assignedTo.length;
  const completed = task.assignedTo.filter(a => a.individualStage === 'done' || a.status === 'completed').length;
  const approved = task.assignedTo.filter(a => a.approval === 'approved').length;
  const rejected = task.assignedTo.filter(a => a.approval === 'rejected').length;
  
  // Check if all tasks are approved (group task completion)
  const allApproved = total > 0 && approved === total;
  const groupTaskStatus = allApproved ? 'All tasks approved - Group task completed!' : 
                         approved > 0 ? `${approved}/${total} tasks approved` : 
                         'Pending approvals';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{task.title}</h1>
            <p className="text-sm text-gray-500">Deadline: {new Date(task.deadline).toLocaleString()}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-3 py-1 bg-gray-200 rounded text-sm">Back</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Assignees</div>
            <div className="text-xl font-semibold">{total}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-xl font-semibold">{completed}/{total}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Approved</div>
            <div className="text-xl font-semibold">{approved}/{total}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-xl font-semibold">{rejected}</div>
          </div>
        </div>

        {/* Group Task Completion Status */}
        <div className={`mb-4 p-4 rounded-lg shadow ${allApproved ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Group Task Status</div>
              <div className={`text-lg font-semibold ${allApproved ? 'text-green-800' : 'text-gray-700'}`}>
                {groupTaskStatus}
              </div>
            </div>
            {allApproved && (
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Display total completion time */}
        {task.completionTime && (
          <div className="mb-4 p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Total Completion Time</div>
            <div className="text-xl font-semibold">{task.completionTime}</div>
          </div>
        )}

        {/* Display individual completion stages */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Individual Completion Stages</h2>
          
          {/* Show completion times for each assignee */}
          <div className="space-y-3 mb-6">
            {task.assignedTo.map((assignment, index) => (
              <div key={`assignee-${assignment.user._id}-${index}`} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{assignment.user.name}</p>
                    <p className="text-xs text-gray-600">{assignment.user.email}</p>
                    <div className="mt-1 flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        assignment.individualStage === 'done' ? 'bg-green-100 text-green-800' :
                        assignment.individualStage === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.individualStage}
                      </span>
                      {assignment.approval && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          assignment.approval === 'approved' ? 'bg-green-100 text-green-800' :
                          assignment.approval === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.approval}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {assignment.completedAt && assignment.assignedAt && (
                      <div className="text-xs text-green-600">
                        <div>Completed: {new Date(assignment.completedAt).toLocaleString()}</div>
                        <div className="font-medium">
                          Time taken: {(() => {
                            const start = new Date(assignment.assignedAt);
                            const end = new Date(assignment.completedAt);
                            const diffMs = end.getTime() - start.getTime();
                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            
                            if (diffDays > 0) {
                              return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
                            } else if (diffHours > 0) {
                              return `${diffHours}h ${diffMinutes}m`;
                            } else {
                              return `${diffMinutes}m`;
                            }
                          })()}
                        </div>
                      </div>
                    )}
                    {!assignment.completedAt && (
                      <div className="text-xs text-gray-500">
                        {assignment.individualStage === 'pending' ? 'In progress...' : 'Not started'}
                      </div>
                    )}
                  </div>
                </div>
                {assignment.notes && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-600">
                    <strong>Notes:</strong> {assignment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional completion stages from backend if available */}
          {task.individualStages && task.individualStages.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-700 mb-3">Additional Stage Information</h3>
              {task.individualStages.map((stage, index) => (
                <div key={`${stage.userId}-${index}`} className="p-3 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800"><strong>User:</strong> {stage.userId}</p>
                      <p className="text-sm text-gray-800"><strong>Stage:</strong> {stage.stage}</p>
                      <p className="text-sm text-gray-800"><strong>Time Taken:</strong> {stage.timeTaken}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <GroupTaskView task={task} currentUserId={currentUser?._id as string} onTaskUpdate={handleTaskUpdate} />

        {/* Remarks Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
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
                      return 'bg-orange-50 border-l-4 border-orange-400';
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
    </div>
  );
};

export default GroupTaskDetail;
