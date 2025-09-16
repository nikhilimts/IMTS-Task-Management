import axios from 'axios';
import type { AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:5000/api';

// Types
export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    isRead: boolean;
    createdAt: string;
    updatedAt?: string;
    channels: {
        inApp: {
            read: boolean;
            readAt?: string;
        };
        email?: {
            enabled: boolean;
            sent: boolean;
            sentAt?: string;
        };
    };
    relatedTask?: {
        _id: string;
        title: string;
        priority?: string;
        status?: string;
    };
    relatedUser?: {
        _id: string;
        name: string;
        email: string;
    };
    sender?: {
        _id: string;
        name: string;
        email: string;
    };
    data?: any;
}

export type NotificationType = 
    | 'task_assigned'
    | 'task_completed'
    | 'task_approved'
    | 'task_rejected'
    | 'task_transferred'
    | 'task_deadline_reminder'
    | 'task_overdue'
    | 'status_changed'
    | 'stage_changed'
    | 'system_announcement';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationParams {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
}

export interface NotificationResponse {
    success: boolean;
    data: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface UnreadCountResponse {
    success: boolean;
    data: {
        unreadCount: number;
    };
}

export interface NotificationTypeOption {
    value: NotificationType;
    label: string;
}

export interface PriorityStyles {
    bg: string;
    text: string;
    border: string;
}

export interface NotificationGroups {
    [key: string]: Notification[];
}

class NotificationService {
    /**
     * Get notifications for the authenticated user
     */
    static async getNotifications(params: NotificationParams = {}): Promise<NotificationResponse> {
        try {
            const response: AxiosResponse<NotificationResponse> = await axios.get(
                `${API_BASE_URL}/notifications`,
                {
                    params,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            
            // Check if it's an axios error with response
            if (error.response) {
                // Server responded with error status
                const errorData = {
                    status: error.response.status,
                    message: error.response.data?.message || `HTTP ${error.response.status} Error`,
                    data: error.response.data
                };
                throw errorData;
            } else if (error.request) {
                // Request was made but no response received
                throw { message: 'Network error - please check your connection' };
            } else {
                // Something else happened
                throw { message: error.message || 'Failed to fetch notifications' };
            }
        }
    }

    /**
     * Get unread notification count
     */
    static async getUnreadCount(): Promise<number> {
        try {
            const response: AxiosResponse<UnreadCountResponse> = await axios.get(
                `${API_BASE_URL}/notifications/unread-count`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data.data.unreadCount;
        } catch (error: any) {
            console.error('Error fetching unread count:', error);
            
            // Check if it's an axios error with response
            if (error.response) {
                const errorData = {
                    status: error.response.status,
                    message: error.response.data?.message || `HTTP ${error.response.status} Error`,
                    data: error.response.data
                };
                throw errorData;
            } else if (error.request) {
                throw { message: 'Network error - please check your connection' };
            } else {
                throw { message: error.message || 'Failed to fetch unread count' };
            }
        }
    }

    /**
     * Mark a notification as read
     */
    static async markAsRead(notificationId: string): Promise<any> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error marking notification as read:', error);
            throw error.response?.data || { message: 'Failed to mark notification as read' };
        }
    }

    /**
     * Mark all notifications as read
     */
    static async markAllAsRead(): Promise<any> {
        try {
            const response = await axios.put(
                `${API_BASE_URL}/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error);
            throw error.response?.data || { message: 'Failed to mark all notifications as read' };
        }
    }

    /**
     * Get notification types
     */
    static async getNotificationTypes(): Promise<NotificationTypeOption[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/notifications/types`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching notification types:', error);
            throw error.response?.data || { message: 'Failed to fetch notification types' };
        }
    }

    /**
     * Create a test notification (development only)
     */
    static async createTestNotification(): Promise<any> {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/notifications/test`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error creating test notification:', error);
            throw error.response?.data || { message: 'Failed to create test notification' };
        }
    }

    /**
     * Format notification time
     */
    static formatNotificationTime(timestamp: string): string {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return notificationTime.toLocaleDateString();
        }
    }

    /**
     * Get notification icon based on type
     */
    static getNotificationIcon(type: NotificationType): string {
        const iconMap: Record<NotificationType, string> = {
            'task_assigned': '📋',
            'task_completed': '✅',
            'task_approved': '✅',
            'task_rejected': '❌',
            'task_transferred': '🔄',
            'task_deadline_reminder': '⏰',
            'task_overdue': '🚨',
            'status_changed': '🔄',
            'stage_changed': '📊',
            'system_announcement': '📢'
        };
        return iconMap[type] || '📬';
    }

    /**
     * Get notification color based on type
     */
    static getNotificationColor(type: NotificationType): string {
        const colorMap: Record<NotificationType, string> = {
            'task_assigned': 'blue',
            'task_completed': 'green',
            'task_approved': 'green',
            'task_rejected': 'red',
            'task_transferred': 'orange',
            'task_deadline_reminder': 'yellow',
            'task_overdue': 'red',
            'status_changed': 'blue',
            'stage_changed': 'purple',
            'system_announcement': 'gray'
        };
        return colorMap[type] || 'gray';
    }

    /**
     * Get priority styles
     */
    static getPriorityStyles(priority: NotificationPriority): PriorityStyles {
        const styleMap: Record<NotificationPriority, PriorityStyles> = {
            'urgent': {
                bg: 'bg-red-100',
                text: 'text-red-800',
                border: 'border-red-300'
            },
            'high': {
                bg: 'bg-orange-100',
                text: 'text-orange-800',
                border: 'border-orange-300'
            },
            'medium': {
                bg: 'bg-blue-100',
                text: 'text-blue-800',
                border: 'border-blue-300'
            },
            'low': {
                bg: 'bg-gray-100',
                text: 'text-gray-800',
                border: 'border-gray-300'
            }
        };
        return styleMap[priority] || styleMap['medium'];
    }

    /**
     * Check if notification is recent (within last 24 hours)
     */
    static isRecentNotification(timestamp: string): boolean {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInHours = (now.getTime() - notificationTime.getTime()) / (1000 * 60 * 60);
        return diffInHours <= 24;
    }

    /**
     * Group notifications by date
     */
    static groupNotificationsByDate(notifications: Notification[]): NotificationGroups {
        const groups: NotificationGroups = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        notifications.forEach(notification => {
            const notificationDate = new Date(notification.createdAt).toDateString();
            let groupKey: string;

            if (notificationDate === today) {
                groupKey = 'Today';
            } else if (notificationDate === yesterday) {
                groupKey = 'Yesterday';
            } else {
                groupKey = new Date(notification.createdAt).toLocaleDateString();
            }

            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(notification);
        });

        return groups;
    }

    /**
     * Filter notifications by type
     */
    static filterNotificationsByType(
        notifications: Notification[], 
        types: NotificationType[]
    ): Notification[] {
        if (!types || types.length === 0) {
            return notifications;
        }
        return notifications.filter(notification => types.includes(notification.type));
    }

    /**
     * Filter notifications by read status
     */
    static filterNotificationsByReadStatus(
        notifications: Notification[], 
        showUnreadOnly: boolean
    ): Notification[] {
        if (!showUnreadOnly) {
            return notifications;
        }
        return notifications.filter(notification => !notification.isRead);
    }

    /**
     * Get notification summary text
     */
    static getNotificationSummary(notifications: Notification[]): string {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const totalCount = notifications.length;

        if (totalCount === 0) {
            return 'No notifications';
        }

        if (unreadCount === 0) {
            return `${totalCount} notification${totalCount > 1 ? 's' : ''} (all read)`;
        }

        return `${unreadCount} unread of ${totalCount} notification${totalCount > 1 ? 's' : ''}`;
    }

    /**
     * Create notification sound (if enabled)
     */
    static playNotificationSound(): void {
        try {
            // Check if user has enabled sound notifications
            const soundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
            
            if (soundEnabled && 'AudioContext' in window) {
                // Create a simple notification sound
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.debug('Could not play notification sound:', error);
        }
    }

    /**
     * Show browser notification (if permission granted)
     */
    static showBrowserNotification(
        title: string, 
        message: string, 
        options: NotificationOptions = {}
    ): void {
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body: message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'task-notification',
                    ...options
                });
            }
        } catch (error) {
            console.debug('Could not show browser notification:', error);
        }
    }

    /**
     * Request notification permission
     */
    static async requestNotificationPermission(): Promise<boolean> {
        try {
            if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }
            return false;
        } catch (error) {
            console.debug('Could not request notification permission:', error);
            return false;
        }
    }
}

export default NotificationService;