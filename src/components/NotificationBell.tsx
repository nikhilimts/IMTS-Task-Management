import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCircle, FaCheckDouble, FaTimes } from 'react-icons/fa';

// Define Notification type to include all properties
type Notification = {
    _id: string;
    isRead: boolean;
    channels: {
        inApp: {
            read: boolean;
            readAt?: Date;
        };
        email?: {
            sent: boolean;
            sentAt?: Date;
        };
    };
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    type: 'task_assigned' | 'task_completed' | 'deadline_reminder' | 'comment_added' | 'status_changed';
    createdAt: Date;
    relatedTask?: {
        _id: string;
        title: string;
    };
};

type NotificationParams = {
    page: number;
    limit: number;
    unreadOnly?: boolean;
    type?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Get auth headers for API calls
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

const NotificationService = {
    getUnreadCount: async (): Promise<number> => {
        try {
            console.log('NotificationService: Making request to:', `${API_BASE_URL}/notifications/unread-count`);
            console.log('NotificationService: Headers:', getAuthHeaders());
            
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                headers: getAuthHeaders()
            });
            
            console.log('NotificationService: Response status:', response.status);
            console.log('NotificationService: Response ok:', response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('NotificationService: Error response:', errorText);
                throw new Error('Failed to fetch unread count');
            }
            
            const data = await response.json();
            console.log('NotificationService: Response data:', data);
            return data.count;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },
    
    getNotifications: async (params: NotificationParams) => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
                ...(params.unreadOnly && { unreadOnly: 'true' }),
                ...(params.type && { type: params.type })
            });
            
            const response = await fetch(`${API_BASE_URL}/notifications?${queryParams}`, {
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return await response.json();
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },
    
    markAsRead: async (id: string): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to mark notification as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },
    
    markAllAsRead: async (): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to mark all notifications as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },
    
    getNotificationIcon: (type: string): string => {
        const icons: Record<string, string> = {
            task_assigned: '👤',
            task_completed: '✅',
            deadline_reminder: '⏰',
            comment_added: '💬',
            status_changed: '📝'
        };
        return icons[type] || '📝';
    },
    
    formatNotificationTime: (createdAt: Date): string => {
        const now = new Date();
        const notificationDate = new Date(createdAt);
        const diff = now.getTime() - notificationDate.getTime();
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return notificationDate.toLocaleDateString();
    },
    
    getNotificationSummary: (notifications: Notification[]): string => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const total = notifications.length;
        
        if (unreadCount === 0) {
            return `All ${total} notifications read`;
        }
        
        return `${unreadCount} unread of ${total} total`;
    }
};

const NotificationBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
    const [selectedType, setSelectedType] = useState<string>('');
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check if user is authenticated
    const isAuthenticated = () => {
        const token = localStorage.getItem('authToken');
        return token && token !== 'null' && token !== 'undefined' && token.length > 10;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial data
    useEffect(() => {
        console.log('NotificationBell: Effect triggered', { isAuthenticated: isAuthenticated(), isOpen });
        if (isAuthenticated()) {
            fetchUnreadCount();
            if (isOpen) {
                fetchNotifications(true);
            }
        } else {
            console.warn('User not authenticated, skipping notification fetch');
            setUnreadCount(0);
            setNotifications([]);
        }
    }, [isOpen, showUnreadOnly, selectedType]);

    // Poll for updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (isAuthenticated()) {
                fetchUnreadCount();
                if (isOpen) {
                    fetchNotifications(true);
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isOpen, showUnreadOnly, selectedType]);

    const fetchUnreadCount = async () => {
        try {
            console.log('NotificationBell: Fetching unread count...');
            console.log('API URL:', `${API_BASE_URL}/notifications/unread-count`);
            console.log('Auth token available:', !!localStorage.getItem('authToken'));
            
            const count = await NotificationService.getUnreadCount();
            console.log('NotificationBell: Unread count received:', count);
            setUnreadCount(count);
        } catch (error: any) {
            console.error('Error fetching unread count:', error);
            
            // Handle authentication errors
            if (error.status === 401 || error.message?.includes('jwt') || error.message?.includes('token')) {
                console.warn('Authentication failed - user may need to log in again');
                // Don't show notification errors for auth issues, just silently handle them
                setUnreadCount(0);
                return;
            }
            
            // For other errors, show them
            if (error.message && !error.message.includes('jwt')) {
                setError(error.message);
            }
        }
    };

    const fetchNotifications = async (reset = false) => {
        try {
            setLoading(true);
            setError(null);

            const params: NotificationParams = {
                page: reset ? 1 : page,
                limit: 10,
                unreadOnly: showUnreadOnly,
                type: selectedType || undefined
            };

            const response = await NotificationService.getNotifications(params);
            
            if (reset) {
                setNotifications(response.data);
                setPage(1);
            } else {
                setNotifications(prev => [...prev, ...response.data]);
            }
            
            setHasMore(response.pagination.page < response.pagination.pages);
            
            if (!reset) {
                setPage(prev => prev + 1);
            }
        } catch (error: any) {
            console.error('Error fetching notifications:', error);
            
            // Handle authentication errors gracefully
            if (error.status === 401 || error.message?.includes('jwt') || error.message?.includes('token')) {
                console.warn('Authentication failed for notifications');
                setNotifications([]);
                setError('Please log in to view notifications');
                return;
            }
            
            setError(error.message || 'Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
            if (!notification.isRead) {
                try {
                    await NotificationService.markAsRead(notification._id);
                    setNotifications(prev => 
                        prev.map(n => 
                            n._id === notification._id 
                                ? { ...n, isRead: true, channels: { ...n.channels, inApp: { ...n.channels.inApp, read: true } } }
                                : n
                        )
                    );
                    setUnreadCount(prev => Math.max(0, prev - 1));
                } catch (error) {
                    console.error('Error marking notification as read:', error);
                }
            }

            // Navigate to related task if available
            if (notification.relatedTask) {
                window.location.href = `/tasks/${notification.relatedTask._id}`;
            }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await NotificationService.markAllAsRead();
            setNotifications(prev => 
                prev.map(n => ({ 
                    ...n, 
                    isRead: true, 
                    channels: { ...n.channels, inApp: { ...n.channels.inApp, read: true } } 
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(false);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setPage(1);
            setHasMore(true);
        }
    };

    const getNotificationStyles = (notification: Notification) => {
        const baseStyles = "p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200";
        const unreadStyles = notification.isRead ? "" : "bg-blue-50 border-l-4 border-l-blue-500";
        return `${baseStyles} ${unreadStyles}`;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            urgent: 'text-red-600',
            high: 'text-orange-600',
            medium: 'text-blue-600',
            low: 'text-gray-600'
        };
        return colors[priority] || colors.medium;
    };

    const filteredNotifications = notifications.filter(n => {
        if (showUnreadOnly && n.isRead) return false;
        if (selectedType && n.type !== selectedType) return false;
        return true;
    });

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
                aria-label="Notifications"
            >
                <FaBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col sm:flex-row gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showUnreadOnly}
                                        onChange={(e) => {
                                            setShowUnreadOnly(e.target.checked);
                                            setPage(1);
                                            setHasMore(true);
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-1">Unread only</span>
                                </label>
                            </div>
                            
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                    <FaCheckDouble className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Add filtering options for notification types */}
                        <div className="flex items-center gap-2 mt-2">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showUnreadOnly}
                                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                                    className="mr-2"
                                />
                                Show Unread Only
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="border rounded p-1"
                            >
                                <option value="">All Types</option>
                                <option value="task_assigned">Task Assigned</option>
                                <option value="task_completed">Task Completed</option>
                                <option value="deadline_reminder">Deadline Reminder</option>
                                <option value="comment_added">Comment Added</option>
                                <option value="status_changed">Status Changed</option>
                            </select>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center text-red-600">
                                {error}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
                            </div>
                        ) : (
                            <>
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={getNotificationStyles(notification)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                <span className="text-lg">
                                                    {NotificationService.getNotificationIcon(notification.type)}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Priority & Read Status */}
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {notification.priority && notification.priority !== 'medium' && (
                                                            <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                                                {notification.priority.toUpperCase()}
                                                            </span>
                                                        )}
                                                        {!notification.isRead && (
                                                            <FaCircle className="text-blue-500 w-2 h-2" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">
                                                        {NotificationService.formatNotificationTime(notification.createdAt)}
                                                    </span>
                                                    
                                                    {notification.relatedTask && (
                                                        <span className="text-xs text-blue-600 font-medium">
                                                            {notification.relatedTask.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More */}
                                {hasMore && (
                                    <div className="p-3 text-center border-t border-gray-200">
                                        <button
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                                        >
                                            {loading ? 'Loading...' : 'Load more'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {filteredNotifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                            <span className="text-xs text-gray-500">
                                {NotificationService.getNotificationSummary(filteredNotifications)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;