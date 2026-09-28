import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/notification/notificationApi";
import {
  setNotifications,
  markAsRead,
  markAllAsRead,
} from "../features/notification/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Bell, MailOpen, Inbox } from "lucide-react";

/** Returns a left-border accent colour based on notification type. */
function getNotificationAccent(type: string, isRead: boolean): string {
  if (isRead) return "2px solid transparent";
  if (type === "MEETING_FOLLOWUP_OVERDUE" || type === "ACTION_ITEM_OVERDUE")
    return "2px solid #F59E0B"; // amber – overdue warnings
  if (type === "PIP_CREATED" || type === "PIP_ESCALATED")
    return "2px solid #EF4444"; // red – PIP critical
  if (type === "MEETING_SCHEDULED" || type === "MEETING_UPDATED")
    return "2px solid #8B5CF6"; // purple – meeting events
  return "2px solid #1A56DB"; // default blue
}

function getNotificationBg(type: string, isRead: boolean): string {
  if (isRead) return "#FFFFFF";
  if (type === "MEETING_FOLLOWUP_OVERDUE" || type === "ACTION_ITEM_OVERDUE")
    return "#FFFBEB"; // amber tint
  if (type === "PIP_CREATED" || type === "PIP_ESCALATED")
    return "#FFF5F5"; // red tint
  if (type === "MEETING_SCHEDULED" || type === "MEETING_UPDATED")
    return "#FAF5FF"; // purple tint
  return "#F9FBFF"; // default blue tint
}

export const NotificationBell: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount } = useAppSelector((s) => s.notification);
  const { data: initialNotifications, isSuccess } = useGetMyNotificationsQuery();
  const [markAsReadApi] = useMarkAsReadMutation();
  const [markAllAsReadApi] = useMarkAllAsReadMutation();

  useEffect(() => {
    if (isSuccess && initialNotifications) {
      dispatch(setNotifications(initialNotifications));
    }
  }, [isSuccess, initialNotifications, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: string | number, url?: string) => {
    await markAsReadApi(id);
    dispatch(markAsRead(id));
    setIsOpen(false);
    if (url) navigate(url);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadApi();
    dispatch(markAllAsRead());
  };

  const handleBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#EEF3FD";
    e.currentTarget.style.color = "#1A56DB";
    e.currentTarget.style.borderColor = "#B5D4F4";
  };
  const handleBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#F5F6F8";
    e.currentTarget.style.color = "#5A6070";
    e.currentTarget.style.borderColor = "#E0E2E8";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        onMouseEnter={handleBtnEnter}
        onMouseLeave={handleBtnLeave}
        style={{
          position: "relative",
          width: 32,
          height: 32,
          background: "#F5F6F8",
          border: "0.5px solid #E0E2E8",
          borderRadius: 8,
          color: "#5A6070",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s, border-color 0.15s",
        }}
      >
        <Bell size={16} aria-hidden="true" />

        {/* Notification dot */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              background: "#E24B4A",
              borderRadius: "50%",
              border: "1.5px solid #F5F6F8",
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            width: 320,
            background: "#FFFFFF",
            border: "0.5px solid #E4E6EC",
            borderRadius: 12,
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          {/* Dropdown header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "0.5px solid #E4E6EC",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: "#EEF3FD",
                    color: "#0C447C",
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#1A56DB",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <MailOpen size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 384, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 0",
                  color: "#9EA3B0",
                }}
              >
                <Inbox size={32} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p style={{ fontSize: 12 }}>All caught up</p>
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.actionUrl)}
                  style={{
                    padding: "12px 16px",
                    borderBottom:
                      idx < notifications.length - 1
                        ? "0.5px solid #F0F2F6"
                        : "none",
                    cursor: "pointer",
                    background: getNotificationBg(n.type, n.isRead),
                    borderLeft: getNotificationAccent(n.type, n.isRead),
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 11, color: "#9EA3B0", marginLeft: 8, whiteSpace: "nowrap" }}>
                      {formatDistanceToNow(new Date(n.deliveryTime || n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#5A6070", lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#64748B" }}>
                    <span>From: <strong style={{ color: "#334155" }}>{n.senderName || 'Super Admin'}</strong></span>
                    {!n.isRead && <span style={{ color: "#2563eb", fontWeight: 700 }}>NEW</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "0.5px solid #E4E6EC",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => { setIsOpen(false); navigate("/notifications"); }}
              style={{
                fontSize: 12,
                fontWeight: 400,
                color: "#1A56DB",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
