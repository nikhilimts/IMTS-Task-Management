/**
 * Utility functions for task status and priority colors
 * Used across multiple components to ensure consistency
 */

export const getTaskStatusColor = (status: string): string => {
  const colors = {
    created: 'bg-gray-100 text-gray-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    approved: 'bg-green-200 text-green-900',
    rejected: 'bg-red-100 text-red-800',
    transferred: 'bg-purple-100 text-purple-800',
    pending: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getTaskPriorityColor = (priority: string): string => {
  const colors = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  };
  return colors[priority as keyof typeof colors] || 'text-gray-600';
};

export const getTaskStageColor = (stage: string): string => {
  const colors = {
    not_started: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-200 text-green-900',
  };
  return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Department performance color
export const getDepartmentPerformanceColor = (completionRate: number): string => {
  if (completionRate >= 80) return 'text-green-600';
  if (completionRate >= 60) return 'text-yellow-600';
  if (completionRate >= 40) return 'text-orange-600';
  return 'text-red-600';
};

// Status display text (human-readable)
export const getStatusDisplayText = (status: string): string => {
  const displayTexts = {
    created: 'Created',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    completed: 'Completed',
    approved: 'Approved',
    rejected: 'Rejected',
    transferred: 'Transferred',
    pending: 'Pending',
    blocked: 'Blocked',
  };
  return displayTexts[status as keyof typeof displayTexts] || status.charAt(0).toUpperCase() + status.slice(1);
};

// Priority display text
export const getPriorityDisplayText = (priority: string): string => {
  const displayTexts = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    urgent: 'Urgent Priority',
  };
  return displayTexts[priority as keyof typeof displayTexts] || priority.charAt(0).toUpperCase() + priority.slice(1);
};