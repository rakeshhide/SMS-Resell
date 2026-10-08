import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Shield,
  User as UserIcon,
  Menu,
  Wallet,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Trash2,
  ArrowRight,
  X
} from 'lucide-react';
import { User } from '../types';
import { ApiClient } from '../services/api';

interface HeaderProps {
  title: string;
  user: User | null;
  onOpenWalletModal: () => void;
  onToggleMobileSidebar?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'wallet' | 'warning' | 'security' | 'system';
  read: boolean;
  action?: () => void;
  actionLabel?: string;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export const Header: React.FC<HeaderProps> = ({
  title,
  user,
  onOpenWalletModal,
  onToggleMobileSidebar,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Fetch fully dynamic notifications from backend server
  const fetchServerNotifications = () => {
    if (!user) return;
    ApiClient.getNotifications(30, 0)
      .then((res) => {
        if (res.success && res.data) {
          const items: NotificationItem[] = res.data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: formatTimeAgo(n.createdAt),
            type: (n.type as NotificationItem['type']) || 'system',
            read: n.isRead,
            action: n.actionUrl === '/wallet' ? onOpenWalletModal : undefined,
            actionLabel: n.actionLabel || undefined,
          }));
          setNotifications(items);
        }
      })
      .catch((err) => {
        console.error('[NOTIFICATIONS] Server fetch error:', err);
      });
  };

  useEffect(() => {
    fetchServerNotifications();
  }, [user?.id, user?.balance]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await ApiClient.markAllNotificationsRead();
    } catch (err) {
      console.error('[NOTIFICATIONS] Mark all read error:', err);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    try {
      await ApiClient.dismissAllNotifications();
    } catch (err) {
      console.error('[NOTIFICATIONS] Dismiss all error:', err);
    }
  };

  const handleDismissNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await ApiClient.dismissNotification(id);
    } catch (err) {
      console.error('[NOTIFICATIONS] Dismiss error:', err);
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      try {
        await ApiClient.markNotificationRead(item.id);
      } catch (err) {
        console.error('[NOTIFICATIONS] Mark read error:', err);
      }
    }

    if (item.action) {
      item.action();
      setNotificationsOpen(false);
    }
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return (
          <div className="notification-item-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <AlertTriangle size={18} />
          </div>
        );
      case 'wallet':
        return (
          <div className="notification-item-icon" style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            <Wallet size={18} />
          </div>
        );
      case 'security':
        return (
          <div className="notification-item-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <ShieldCheck size={18} />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="notification-item-icon" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
            <Radio size={18} />
          </div>
        );
    }
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {onToggleMobileSidebar && (
          <button
            className="mobile-menu-toggle"
            onClick={onToggleMobileSidebar}
            title="Open Navigation"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 style={{
          fontSize: 'clamp(17px, 3.5vw, 22px)',
          fontWeight: 700,
          color: 'var(--text-main)',
          letterSpacing: '-0.02em',
          margin: 0
        }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Mobile Quick Balance Pill */}
        <button
          onClick={onOpenWalletModal}
          className="mobile-header-wallet"
          title="Top Up Wallet"
        >
          <Wallet size={14} color="#3b82f6" />
          <span>₹{(user?.balance ?? 0).toFixed(2)}</span>
        </button>

        {/* Search Bar - Hidden on tablet/mobile */}
        <div className="header-search-bar">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search API keys, logs..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
              width: '100%',
            }}
          />
        </div>

        {/* Notification Bell Container */}
        <div className="notification-container" ref={dropdownRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: notificationsOpen ? 'var(--bg-surface)' : 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: notificationsOpen ? '#3b82f6' : 'var(--text-secondary)',
              position: 'relative',
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Notifications"
            aria-label="Toggle notifications dropdown"
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                minWidth: '16px',
                height: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.4)'
              }}>
                {unreadCount}
              </span>
            ) : (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}></span>
            )}
          </button>

          {/* Interactive Popover Menu */}
          {notificationsOpen && (
            <div className="notification-popover" role="dialog" aria-label="Notifications panel">
              {/* Header */}
              <div className="notification-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#eff6ff',
                      color: '#3b82f6',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '6px'
                        }}
                        title="Mark all as read"
                      >
                        <CheckCheck size={14} />
                        <span>Read</span>
                      </button>
                      <button
                        onClick={handleClearAll}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: '4px 6px',
                          borderRadius: '6px'
                        }}
                        title="Clear list"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <CheckCircle2 size={32} color="#10b981" />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      All caught up
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      No new account notifications or system alerts.
                    </div>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`notification-item ${!item.read ? 'unread' : ''}`}
                    >
                      {renderIcon(item.type)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '2px',
                          gap: '8px'
                        }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: item.read ? 600 : 700,
                            color: 'var(--text-main)',
                            lineHeight: 1.3
                          }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.timestamp}
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4
                        }}>
                          {item.message}
                        </p>

                        {item.actionLabel && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#3b82f6',
                            marginTop: '6px'
                          }}>
                            <span>{item.actionLabel}</span>
                            <ArrowRight size={12} />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginTop: '2px' }}>
                        {!item.read && (
                          <div style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            flexShrink: 0
                          }} />
                        )}
                        <button
                          onClick={(e) => handleDismissNotification(e, item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.6,
                            transition: 'opacity 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                          title="Delete notification"
                          aria-label="Delete notification"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="notification-footer">
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Wallet Balance: ₹{(user?.balance ?? 0).toFixed(2)}
                </span>
                <button
                  onClick={() => {
                    onOpenWalletModal();
                    setNotificationsOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3b82f6',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <span>Recharge</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px 4px 4px',
          borderRadius: '30px',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: user?.role === 'admin' ? '#8b5cf6' : '#3b82f6',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <div className="header-user-details">
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-main)',
              lineHeight: 1.2
            }}>
              {user?.fullName || 'Developer'}
            </span>
            <span style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {user?.role === 'admin' && <Shield size={10} color="#8b5cf6" />}
              {user?.role === 'admin' ? 'Administrator' : 'Developer Plan'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

