import api from './api';

export interface Task {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'transferred' | 'pending';
  stage: 'planning' | 'pending' | 'done';
  isGroupTask: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
      role: string;
    };
    assignedAt: string;
    status: string;
    individualStage: 'planning' | 'pending' | 'done';
    completedAt?: string;
    notes?: string;
    approval?: 'pending' | 'approved' | 'rejected';
    approvalAt?: string;
    approvedBy?: { _id: string; name?: string } | string;
    rejectionReason?: string;
  }>;
  department: {
    _id: string;
    name: string;
  };
  tags: string[];
  attachments: Array<{
    _id: string;
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  remarks: {
    creator: Array<{
      _id: string;
      text: string;
      author: {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
      createdAt: string;
    }>;
    assignee: Array<{
      _id: string;
      text: string;
      author: {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
      createdAt: string;
    }>;
    general: Array<{
      _id: string;
      text: string;
      author: {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
      createdAt: string;
    }>;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  completionTime?: string; // Time taken for task completion
  individualStages: Array<{ userId: string; stage: string; timeTaken: string; }>; // Individual stages for each assignee
}

export interface CreateTaskData {
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string[];
  tags?: string[];
  attachments?: File[];
  isGroupTask?: boolean;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  removeAttachments?: string[];
  attachments?: File[];
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  stage?: string;
  assignedTo?: string;
  createdBy?: string;
  department?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TasksResponse {
  success: boolean;
  data: {
    tasks: Task[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTasks: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface TaskResponse {
  success: boolean;
  data: {
    task: Task;
    history?: any[];
  };
}

export interface TaskStatsResponse {
  success: boolean;
  data: {
    total: number;
    created: number;
    assigned: number;
    in_progress: number;
    completed: number;
    approved: number;
    rejected: number;
    high_priority: number;
    urgent_priority: number;
    overdue: number;
  };
}

export interface DashboardStatsResponse {
  success: boolean;
  data: {
    notStarted: {
      count: number;
      label: string;
      percentage: number;
    };
    pending: {
      count: number;
      label: string;
      percentage: number;
    };
    done: {
      count: number;
      label: string;
      percentage: number;
    };
    totalAssigned: number;
  };
}

export interface RemarkData {
  text: string;
  category?: 'creator' | 'assignee' | 'general' | 'auto';
}

export interface AssignTaskData {
  userIds: string[];
  reason?: string;
}

export interface UpdateStatusData {
  status: 'created' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'transferred' | 'pending';
  reason?: string;
}

export interface UpdateStageData {
  stage: 'planning' | 'pending' | 'done';
  reason?: string;
}

export interface UpdateIndividualStageData {
  stage?: 'planning' | 'pending' | 'done';
  status?: 'assigned' | 'in_progress' | 'completed' | 'blocked';
  notes?: string;
}

export interface UpdateIndividualApprovalData {
  userId: string;
  decision: 'approve' | 'reject';
  reason?: string;
}

class TaskService {
  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskData): Promise<TaskResponse> {
    // If there are files, use FormData
    if (taskData.attachments && taskData.attachments.length > 0) {
      const formData = new FormData();
      
      formData.append('title', taskData.title);
      formData.append('description', taskData.description);
      formData.append('deadline', taskData.deadline);
      formData.append('priority', taskData.priority);
      
      if (taskData.assignedTo) {
        formData.append('assignedTo', JSON.stringify(taskData.assignedTo));
      }
      
      if (taskData.tags) {
        formData.append('tags', JSON.stringify(taskData.tags));
      }
      
      if (taskData.isGroupTask !== undefined) {
        formData.append('isGroupTask', JSON.stringify(taskData.isGroupTask));
      }
      
      taskData.attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // If no files, use regular JSON
      const response = await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline,
        priority: taskData.priority,
        assignedTo: taskData.assignedTo || [],
        tags: taskData.tags || []
      });
      return response.data;
    }
  }

  /**
   * Get all tasks with filtering and pagination
   */
  async getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  }

  /**
   * Get single task by ID
   */
  async getTask(id: string): Promise<TaskResponse> {
    console.log('TaskService: Making API call to /tasks/' + id);
    try {
      const response = await api.get(`/tasks/${id}`);
      console.log('TaskService: API response received:', response);
      console.log('TaskService: Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('TaskService: API call failed:', error);
      throw error;
    }
  }

  /**
   * Update task details
   */
  async updateTask(id: string, updateData: UpdateTaskData): Promise<TaskResponse> {
    const formData = new FormData();
    
    if (updateData.title) formData.append('title', updateData.title);
    if (updateData.description) formData.append('description', updateData.description);
    if (updateData.deadline) formData.append('deadline', updateData.deadline);
    if (updateData.priority) formData.append('priority', updateData.priority);
    if (updateData.tags) formData.append('tags', JSON.stringify(updateData.tags));
    if (updateData.removeAttachments) {
      formData.append('removeAttachments', JSON.stringify(updateData.removeAttachments));
    }
    
    if (updateData.attachments) {
      updateData.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await api.put(`/tasks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(id: string, statusData: UpdateStatusData): Promise<TaskResponse> {
    const response = await api.put(`/tasks/${id}/status`, statusData);
    return response.data;
  }

  /**
   * Update task stage
   */
  async updateTaskStage(id: string, stageData: UpdateStageData): Promise<TaskResponse> {
    const response = await api.put(`/tasks/${id}/stage`, stageData);
    return response.data;
  }

  /**
   * Update individual stage for group task member
   */
  async updateIndividualStage(id: string, stageData: UpdateIndividualStageData): Promise<TaskResponse> {
    const response = await api.put(`/tasks/${id}/individual-stage`, stageData);
    return response.data;
  }

  /**
   * Assign task to users
   */
  async assignTask(id: string, assignData: AssignTaskData): Promise<TaskResponse> {
    const response = await api.put(`/tasks/${id}/assign`, assignData);
    return response.data;
  }

  /**
   * Add remark to task
   */
  async addRemark(id: string, remarkData: RemarkData): Promise<TaskResponse> {
    const response = await api.post(`/tasks/${id}/remarks`, remarkData);
    return response.data;
  }

  /**
   * Delete task (soft delete)
   */
  async deleteTask(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<TaskStatsResponse> {
    const response = await api.get('/tasks/stats');
    return response.data;
  }

  /**
   * Get dashboard statistics for progress cards
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await api.get('/tasks/dashboard-stats');
    return response.data;
  }

  /**
   * Add attachments to existing task
   */
  async addAttachments(id: string, files: File[]): Promise<{
    success: boolean;
    message: string;
    data: {
      attachments: any[];
      count: number;
    };
  }> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    const response = await api.post(`/tasks/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  /**
   * Remove attachment from task
   */
  async removeAttachment(taskId: string, attachmentId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  }

  /**
   * Get download URL for attachment
   */
  getAttachmentDownloadUrl(taskId: string, attachmentId: string): string {
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    return `${baseUrl}/tasks/${taskId}/attachments/${attachmentId}/download`;
  }

  /**
   * Download task attachment
   */
  async downloadAttachment(taskId: string, attachmentId: string): Promise<void> {
    const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'download';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Approve or reject an individual assignee in a group task
   */
  async updateIndividualApproval(id: string, data: UpdateIndividualApprovalData): Promise<TaskResponse> {
    const response = await api.put(`/tasks/${id}/individual-approval`, data);
    return response.data;
  }
}

export default new TaskService();
