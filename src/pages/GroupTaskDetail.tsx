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
      const category = getRemarkCategory();
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>

        <GroupTaskView task={task} currentUserId={currentUser?._id as string} onTaskUpdate={handleTaskUpdate} />

        {/* Remarks Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Remarks & Comments</h2>

          {/* Add New Remark */}
          <div className="mb-4">
            <div className="flex space-x-2">
              <textarea
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                placeholder="Add a remark or comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button
                onClick={handleAddRemark}
                disabled={!newRemark.trim() || addingRemark}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {addingRemark ? 'Adding...' : 'Add Remark'}
              </button>
            </div>
          </div>

          {/* Existing Remarks */}
          <div className="space-y-3">
            {(() => {
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
              allRemarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              return allRemarks.map((remark, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-800">{remark.author.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          remark.category === 'creator' ? 'bg-blue-500 text-white' :
                          remark.category === 'assignee' ? 'bg-emerald-500 text-white' :
                          'bg-slate-500 text-white'
                        }`}>
                          {remark.category}
                        </span>
                      </div>
                      <p className="text-gray-700">{remark.text}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(remark.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupTaskDetail;
