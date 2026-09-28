import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type {
  ScheduledNotification,
  ScheduledNotificationPayload,
  AudienceData,
} from "./superadminNotificationTypes";

export const superadminNotificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getScheduledNotifications: builder.query<ScheduledNotification[], { status?: string; search?: string } | void>({
      query: (params) => {
        const queryParts: string[] = [];
        if (params?.status && params.status !== 'ALL') {
          queryParts.push(`status=${encodeURIComponent(params.status)}`);
        }
        if (params?.search) {
          queryParts.push(`search=${encodeURIComponent(params.search)}`);
        }
        const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
        return `/notifications/admin/scheduled/${queryString}`;
      },
      transformResponse: (response: ApiResponse<ScheduledNotification[]> | any) => {
        return response?.data || response?.results || response || [];
      },
      providesTags: ["ScheduledNotifications"],
    }),

    getScheduledNotificationById: builder.query<ScheduledNotification, string>({
      query: (id) => `/notifications/admin/scheduled/${id}/`,
      transformResponse: (response: ApiResponse<ScheduledNotification> | any) => {
        return response?.data || response;
      },
      providesTags: (result, error, id) => [{ type: "ScheduledNotifications", id }],
    }),

    getAudienceData: builder.query<AudienceData, void>({
      query: () => "/notifications/admin/scheduled/audiences/",
      transformResponse: (response: ApiResponse<AudienceData> | any) => {
        return response?.data || response;
      },
    }),

    createScheduledNotification: builder.mutation<ScheduledNotification, ScheduledNotificationPayload>({
      query: (payload) => ({
        url: "/notifications/admin/scheduled/",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<ScheduledNotification> | any) => {
        return response?.data || response;
      },
      invalidatesTags: ["ScheduledNotifications", "Profile"],
    }),

    updateScheduledNotification: builder.mutation<ScheduledNotification, { id: string; payload: Partial<ScheduledNotificationPayload> }>({
      query: ({ id, payload }) => ({
        url: `/notifications/admin/scheduled/${id}/`,
        method: "PATCH",
        body: payload,
      }),
      transformResponse: (response: ApiResponse<ScheduledNotification> | any) => {
        return response?.data || response;
      },
      invalidatesTags: ["ScheduledNotifications", "Profile"],
    }),

    deleteScheduledNotification: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/admin/scheduled/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ScheduledNotifications"],
    }),

    sendScheduledNotificationNow: builder.mutation<ScheduledNotification, string>({
      query: (id) => ({
        url: `/notifications/admin/scheduled/${id}/send/`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<ScheduledNotification> | any) => {
        return response?.data || response;
      },
      invalidatesTags: ["ScheduledNotifications", "Profile"],
    }),

    cancelScheduledNotification: builder.mutation<ScheduledNotification, string>({
      query: (id) => ({
        url: `/notifications/admin/scheduled/${id}/cancel/`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<ScheduledNotification> | any) => {
        return response?.data || response;
      },
      invalidatesTags: ["ScheduledNotifications"],
    }),
  }),
});

export const {
  useGetScheduledNotificationsQuery,
  useGetScheduledNotificationByIdQuery,
  useGetAudienceDataQuery,
  useCreateScheduledNotificationMutation,
  useUpdateScheduledNotificationMutation,
  useDeleteScheduledNotificationMutation,
  useSendScheduledNotificationNowMutation,
  useCancelScheduledNotificationMutation,
} = superadminNotificationApi;
