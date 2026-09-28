import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import {
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/notification/notificationApi";
import { markAsRead, markAllAsRead } from "../features/notification/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useAppSelector(state => state.notification);

  const [markAsReadApi] = useMarkAsReadMutation();
  const [markAllAsReadApi] = useMarkAllAsReadMutation();

  const handleNotificationClick = async (id: string | number, url?: string) => {
    await markAsReadApi(id);
    dispatch(markAsRead(id));
    if (url) navigate(url);
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllAsReadApi().unwrap(); dispatch(markAllAsRead()); }
    catch (error) { console.error("Failed to mark all as read:", error); }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Notifications</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Manage all your alerts and activities</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead}
            style={{ background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500 }}
            className="hover:bg-[#D6E8F9] transition-colors self-start sm:self-auto">
            Mark all as read
          </button>
        )}
      </div>

      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F5F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 24, height: 24, color: '#9EA3B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 6 }}>No notifications yet</h2>
            <p style={{ fontSize: 12, color: '#9EA3B0', maxWidth: 280, margin: '0 auto' }}>
              We'll notify you when something important happens in the system.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, idx) => (
              <div key={notification.id} onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 18px', cursor: 'pointer', borderBottom: idx < notifications.length - 1 ? '0.5px solid #F0F2F6' : 'none', background: !notification.isRead ? '#EEF3FD' : '#FFFFFF' }}
                className="hover:bg-[#FAFBFF] transition-colors group">
                <div style={{ marginRight: 12, marginTop: 6, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: !notification.isRead ? '#1A56DB' : '#E0E2E8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                    <h3 style={{ fontSize: 13, fontWeight: !notification.isRead ? 600 : 500, color: '#111827' }}>{notification.title}</h3>
                    <span style={{ fontSize: 11, color: '#9EA3B0', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {formatDistanceToNow(new Date(notification.deliveryTime || notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: !notification.isRead ? '#334155' : '#64748B', lineHeight: 1.5 }}>{notification.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94A3B8' }}>
                    <span>From: <strong style={{ color: '#475569' }}>{notification.senderName || 'Super Admin'}</strong></span>
                    {notification.deliveryTime && (
                      <span>Delivered: {new Date(notification.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                    )}
                  </div>
                  {notification.actionUrl && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: '#1A56DB', opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
                      <span>View details</span>
                      <ChevronRight size={12} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button onClick={() => navigate('/dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          className="hover:text-[#1A56DB] transition-colors">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;
