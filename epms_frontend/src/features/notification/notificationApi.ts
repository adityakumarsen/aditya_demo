import { api } from "../../services/api";
import type { NotificationResponse } from "./notificationTypes";
import type { ApiResponse } from "../../services/ApiResponse";

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyNotifications: builder.query<NotificationResponse[], void>({
      query: () => "/notifications/",
      transformResponse: (response: ApiResponse<NotificationResponse[]> | any) => {
        const raw = response?.data || response?.results || response || [];
        if (!Array.isArray(raw)) return [];
        return raw.map((item: any) => ({
          ...item,
          isRead: item.isRead ?? item.is_read ?? false,
          createdAt: item.createdAt || item.delivery_time || item.created_at || new Date().toISOString(),
          senderName: item.senderName || item.sender_name || "Super Admin",
          deliveryTime: item.deliveryTime || item.delivery_time || item.created_at,
          type: item.type || item.notification_type || "SYSTEM",
          actionUrl: item.actionUrl || "/notifications",
        }));
      },
      providesTags: ["Profile", "ScheduledNotifications"],
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => "/notifications/unread-count/",
      transformResponse: (response: ApiResponse<number> | any) => {
        return response?.data ?? response?.unreadCount ?? response ?? 0;
      },
      providesTags: ["Profile", "ScheduledNotifications"],
    }),
    markAsRead: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `/notifications/${id}/read/`,
        method: "PATCH",
      }),
      invalidatesTags: ["Profile"],
    }),
    markAllAsRead: builder.mutation<void, void>({
      query: () => ({
        url: "/notifications/read-all/",
        method: "PATCH",
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
