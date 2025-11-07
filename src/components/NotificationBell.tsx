import { useState, useEffect, useRef } from 'react';
import { FaBell, FaCircle, FaCheckDouble, FaTimes } from 'react-icons/fa';

// Type Definitions
type Notification = {
  _id: string;
  isRead: boolean;
  channels?: {
    inApp?: {
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

// Auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Notification Service
const NotificationService = {
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch unread count');
      const data = await res.json();
      return data.count;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  },

  getNotifications: async (params: NotificationParams) => {
    try {
      const query = new URLSearchParams({
        page: params.page.toString(),
        limit: params.limit.toString(),
        ...(params.unreadOnly && { unreadOnly: 'true' }),
        ...(params.type && { type: params.type }),
      });
      const res = await fetch(`${API_BASE_URL}/notifications?${query}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return await res.json();
    } catch (err) {
      console.error('Error fetching notifications:', err);
      throw err;
    }
  },

  markAsRead: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark as read');
  },

  markAllAsRead: async () => {
    const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark all as read');
  },

  getNotificationIcon: (type: string): string => {
    const icons: Record<string, string> = {
      task_assigned: '👤',
      task_completed: '✅',
      deadline_reminder: '⏰',
      comment_added: '💬',
      status_changed: '📝',
    };
    return icons[type] || '📝';
  },

  formatNotificationTime: (createdAt: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(createdAt).toLocaleDateString();
  },
};

// ✅ Normalize function — ensures channels.inApp always exists
const normalizeNotifications = (data: Notification[]): Notification[] => {
  return data.map((n) => ({
    ...n,
    channels: {
      ...n.channels,
      inApp: n.channels?.inApp || { read: n.isRead, readAt: n.createdAt },
    },
  }));
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Authentication check
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    return token && token.length > 10;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUnreadCount();
      if (isOpen) fetchNotifications(true);
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isOpen, showUnreadOnly, selectedType]);

  const fetchUnreadCount = async () => {
    const count = await NotificationService.getUnreadCount();
    setUnreadCount(count);
  };

  const fetchNotifications = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const params: NotificationParams = {
        page: reset ? 1 : page,
        limit: 10,
        unreadOnly: showUnreadOnly,
        type: selectedType || undefined,
      };
      const res = await NotificationService.getNotifications(params);
      const normalized = normalizeNotifications(res.data);
      if (reset) {
        setNotifications(normalized);
        setPage(1);
      } else {
        setNotifications((prev) => [...prev, ...normalized]);
        setPage((prev) => prev + 1);
      }
      setHasMore(res.pagination.page < res.pagination.pages);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Safe Mark One as Read
  const handleNotificationClick = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await NotificationService.markAsRead(n._id);
        setNotifications((prev) =>
          prev.map((item) =>
            item._id === n._id
              ? {
                  ...item,
                  isRead: true,
                  channels: {
                    ...item.channels,
                    inApp: { ...(item.channels?.inApp || {}), read: true, readAt: new Date() },
                  },
                }
              : item
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (n.relatedTask) window.location.href = `/tasks/${n.relatedTask._id}`;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // ✅ Safe Mark All Read
  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          channels: {
            ...n.channels,
            inApp: { ...(n.channels?.inApp || {}), read: true, readAt: new Date() },
          },
        }))
      );
      setUnreadCount(0);
      await fetchNotifications(true); // refresh clean list
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) fetchNotifications(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setPage(1);
      setHasMore(true);
    }
  };

  const getNotificationStyles = (n: Notification) =>
    `p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
      n.isRead ? '' : 'bg-blue-50 border-l-4 border-l-blue-500'
    }`;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-blue-600',
      low: 'text-gray-600',
    };
    return colors[priority] || colors.medium;
  };

  const filtered = notifications.filter((n) => {
    if (showUnreadOnly && n.isRead) return false;
    if (selectedType && n.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-1">Unread only</span>
              </label>

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

            <div className="flex items-center gap-2 mt-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border rounded p-1 text-sm"
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
              <div className="p-4 text-center text-gray-500">Loading notifications...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {showUnreadOnly ? 'No unread notifications' : 'No notifications'}
              </div>
            ) : (
              <>
                {filtered.map((n) => (
                  <div key={n._id} onClick={() => handleNotificationClick(n)} className={getNotificationStyles(n)}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1 text-lg">
                        {NotificationService.getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            {n.priority !== 'medium' && (
                              <span className={`text-xs font-medium ${getPriorityColor(n.priority)}`}>
                                {n.priority.toUpperCase()}
                              </span>
                            )}
                            {!n.isRead && <FaCircle className="text-blue-500 w-2 h-2" />}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {NotificationService.formatNotificationTime(n.createdAt)}
                          </span>
                          {n.relatedTask && (
                            <span className="text-xs text-blue-600 font-medium">{n.relatedTask.title}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

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
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
