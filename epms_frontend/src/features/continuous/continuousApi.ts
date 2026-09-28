import { api } from "../../services/api";
import type { ApiResponse } from "../../services/ApiResponse";
import type {
  ContinuousFeedbackResponse,
  ContinuousFeedbackRequest,
  FeedbackReplyResponse,
  FeedbackReplyRequest,
  OneOnOneMeetingResponse,
  OneOnOneMeetingRequest,
  MeetingCommentResponse,
  MeetingCommentRequest,
  FeedbackTagResponse,
  FeedbackTagRequest,
  PerformanceHistoryResponse,
  ContinuousStatsResponse,
  DepartmentBenchmarksResponse,
  GoalsPulseOverlayResponse,
} from "./continuousTypes";
import type { PagedResponse } from "../employee/employeeTypes";

export const continuousApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Feedback Tags
    getAllFeedbacks: builder.query<PagedResponse<ContinuousFeedbackResponse>, { page: number; size: number; status?: string; feedbackType?: string; tagId?: number; createdAfter?: string; createdBefore?: string }>({
      query: ({ page, size, status, feedbackType, tagId, createdAfter, createdBefore }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("size", String(size));
        if (status) params.append("status", status);
        if (feedbackType) params.append("feedbackType", feedbackType);
        if (tagId) params.append("tagId", String(tagId));
        if (createdAfter) params.append("createdAfter", createdAfter);
        if (createdBefore) params.append("createdBefore", createdBefore);
        return `/feedbacks?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getFeedbackTags: builder.query<FeedbackTagResponse[], void>({
      query: () => "/tags",
      transformResponse: (response: ApiResponse<FeedbackTagResponse[]>) => response.data,
      providesTags: ["FeedbackTag" as any],
    }),
    createFeedbackTag: builder.mutation<FeedbackTagResponse, FeedbackTagRequest>({
      query: (body) => ({
        url: "/tags",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackTagResponse>) => response.data,
      invalidatesTags: ["FeedbackTag" as any],
    }),
    updateFeedbackTag: builder.mutation<FeedbackTagResponse, { id: number; body: FeedbackTagRequest }>({
      query: ({ id, body }) => ({
        url: `/tags/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackTagResponse>) => response.data,
      invalidatesTags: ["FeedbackTag" as any],
    }),
    deleteFeedbackTag: builder.mutation<void, number>({
      query: (id) => ({
        url: `/tags/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FeedbackTag" as any],
    }),

    // Continuous Feedback
    getFeedbacksByEmployee: builder.query<PagedResponse<ContinuousFeedbackResponse>, { employeeId: number | string; page: number; size: number; feedbackType?: string; tagId?: number; createdAfter?: string; createdBefore?: string }>({
      query: ({ employeeId, page, size, feedbackType, tagId, createdAfter, createdBefore }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("size", String(size));
        if (feedbackType) params.append("feedbackType", feedbackType);
        if (tagId) params.append("tagId", String(tagId));
        if (createdAfter) params.append("createdAfter", createdAfter);
        if (createdBefore) params.append("createdBefore", createdBefore);
        return `/feedbacks/employee/${employeeId}?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getFeedbacksByManager: builder.query<PagedResponse<ContinuousFeedbackResponse>, { managerId: number | string; status?: string; page: number; size: number; feedbackType?: string; tagId?: number; createdAfter?: string; createdBefore?: string }>({
      query: ({ managerId, status, page, size, feedbackType, tagId, createdAfter, createdBefore }) => {
        const params = new URLSearchParams();
        params.append("page", String(page));
        params.append("size", String(size));
        if (status) params.append("status", status);
        if (feedbackType) params.append("feedbackType", feedbackType);
        if (tagId) params.append("tagId", String(tagId));
        if (createdAfter) params.append("createdAfter", createdAfter);
        if (createdBefore) params.append("createdBefore", createdBefore);
        return `/feedbacks/manager/${managerId}?${params.toString()}`;
      },
      transformResponse: (response: ApiResponse<PagedResponse<ContinuousFeedbackResponse>>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    createFeedback: builder.mutation<ContinuousFeedbackResponse, ContinuousFeedbackRequest>({
      query: (body) => ({
        url: "/feedbacks",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),
    updateFeedback: builder.mutation<ContinuousFeedbackResponse, { id: number | string; body: ContinuousFeedbackRequest }>({
      query: ({ id, body }) => ({
        url: `/feedbacks/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),
    deleteFeedback: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `/feedbacks/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),
    publishFeedback: builder.mutation<ContinuousFeedbackResponse, number | string>({
      query: (id) => ({
        url: `/feedbacks/${id}/publish`,
        method: "PATCH",
      }),
      transformResponse: (response: ApiResponse<ContinuousFeedbackResponse>) => response.data,
      invalidatesTags: ["ContinuousFeedback" as any, "PerformanceHistory" as any],
    }),

    // Feedback Replies
    getFeedbackReplies: builder.query<FeedbackReplyResponse[], number | string>({
      query: (feedbackId) => `/feedbacks/${feedbackId}/replies`,
      transformResponse: (response: ApiResponse<FeedbackReplyResponse[]>) => response.data,
      providesTags: (result, error, feedbackId) => [{ type: "FeedbackReply" as any, id: feedbackId }],
    }),
    replyToFeedback: builder.mutation<FeedbackReplyResponse, { feedbackId: number | string; body: FeedbackReplyRequest }>({
      query: ({ feedbackId, body }) => ({
        url: `/feedbacks/${feedbackId}/replies`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackReplyResponse>) => response.data,
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),
    deleteReply: builder.mutation<void, { replyId: number | string; feedbackId: number | string }>({
      query: ({ replyId }) => ({
        url: `/feedbacks/replies/${replyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),
    updateReply: builder.mutation<FeedbackReplyResponse, { replyId: number | string; feedbackId: number | string; body: FeedbackReplyRequest }>({
      query: ({ replyId, body }) => ({
        url: `/feedbacks/replies/${replyId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<FeedbackReplyResponse>) => response.data,
      invalidatesTags: (result, error, { feedbackId }) => [{ type: "FeedbackReply" as any, id: feedbackId }, "PerformanceHistory" as any],
    }),

    // 1-on-1 Meetings
    getAllMeetings: builder.query<PagedResponse<OneOnOneMeetingResponse>, { page: number; size: number; status?: string }>({
      query: ({ page, size, status }) => {
        let url = `/meetings?page=${page}&size=${size}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByEmployee: builder.query<PagedResponse<OneOnOneMeetingResponse>, { employeeId: number; page: number; size: number }>({
      query: ({ employeeId, page, size }) => `/meetings/employee/${employeeId}?page=${page}&size=${size}`,
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getMeetingsByManager: builder.query<PagedResponse<OneOnOneMeetingResponse>, { managerId: number; status?: string; page: number; size: number }>({
      query: ({ managerId, status, page, size }) => {
        let url = `/meetings/manager/${managerId}?page=${page}&size=${size}`;
        if (status) url += `&status=${status}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<OneOnOneMeetingResponse>>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    scheduleMeeting: builder.mutation<OneOnOneMeetingResponse, OneOnOneMeetingRequest>({
      query: (body) => ({
        url: "/meetings",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),
    updateMeeting: builder.mutation<OneOnOneMeetingResponse, { id: number; body: OneOnOneMeetingRequest }>({
      query: ({ id, body }) => ({
        url: `/meetings/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),
    deleteMeeting: builder.mutation<void, number>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),
    publishMeeting: builder.mutation<OneOnOneMeetingResponse, number>({
      query: (id) => ({
        url: `/meetings/${id}/publish`,
        method: "PATCH",
      }),
      transformResponse: (response: ApiResponse<OneOnOneMeetingResponse>) => response.data,
      invalidatesTags: ["OneOnOneMeeting" as any, "PerformanceHistory" as any],
    }),

    // Meeting Comments
    getMeetingComments: builder.query<MeetingCommentResponse[], number>({
      query: (meetingId) => `/meetings/${meetingId}/comments`,
      transformResponse: (response: ApiResponse<MeetingCommentResponse[]>) => response.data,
      providesTags: (result, error, meetingId) => [{ type: "MeetingComment" as any, id: meetingId }],
    }),
    addMeetingComment: builder.mutation<MeetingCommentResponse, { meetingId: number; body: MeetingCommentRequest }>({
      query: ({ meetingId, body }) => ({
        url: `/meetings/${meetingId}/comments`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<MeetingCommentResponse>) => response.data,
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),
    deleteComment: builder.mutation<void, { commentId: number; meetingId: number }>({
      query: ({ commentId }) => ({
        url: `/meetings/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),
    updateComment: builder.mutation<MeetingCommentResponse, { commentId: number; meetingId: number; body: MeetingCommentRequest }>({
      query: ({ commentId, body }) => ({
        url: `/meetings/comments/${commentId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<MeetingCommentResponse>) => response.data,
      invalidatesTags: (result, error, { meetingId }) => [{ type: "MeetingComment" as any, id: meetingId }, "PerformanceHistory" as any],
    }),

    updateActionItemStatus: builder.mutation<void, { meetingId: number; itemId: number; status: string }>({
      query: ({ meetingId, itemId, status }) => ({
        url: `/meetings/${meetingId}/items/${itemId}/status?status=${status}`,
        method: "PUT",
      }),
      invalidatesTags: ["OneOnOneMeeting" as any],
    }),

    reopenActionItem: builder.mutation<void, { meetingId: number; itemId: number; reason: string }>({
      query: ({ meetingId, itemId, reason }) => ({
        url: `/meetings/${meetingId}/items/${itemId}/reopen?reason=${encodeURIComponent(reason)}`,
        method: "PUT",
      }),
      invalidatesTags: ["OneOnOneMeeting" as any],
    }),

    // Performance History
    getPerformanceHistoryByEmployee: builder.query<PagedResponse<PerformanceHistoryResponse>, { employeeId: number; sourceType?: string; onlyByManager?: boolean; isConducted?: boolean; page: number; size: number }>({
      query: ({ employeeId, sourceType, onlyByManager, isConducted, page, size }) => {
        let url = `/performance-history/employee/${employeeId}?page=${page}&size=${size}`;
        if (sourceType && sourceType !== 'ALL') url += `&sourceType=${sourceType}`;
        if (onlyByManager !== undefined) url += `&onlyByManager=${onlyByManager}`;
        if (isConducted !== undefined) url += `&isConducted=${isConducted}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<PerformanceHistoryResponse>>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getAllPerformanceHistory: builder.query<PagedResponse<PerformanceHistoryResponse>, { sourceType?: string; departmentId?: number | string; startDate?: string; endDate?: string; page: number; size: number }>({
      query: ({ sourceType, departmentId, startDate, endDate, page, size }) => {
        let url = `/performance-history/all?page=${page}&size=${size}`;
        if (sourceType && sourceType !== 'ALL') url += `&sourceType=${sourceType}`;
        if (departmentId) url += `&departmentId=${departmentId}`;
        if (startDate) url += `&startDate=${startDate}`;
        if (endDate) url += `&endDate=${endDate}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PagedResponse<PerformanceHistoryResponse>>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getPerformanceHistoryAnalytics: builder.query<PerformanceHistoryResponse[], number | string | undefined>({
      query: (departmentId) => {
        let url = "/performance-history/all/raw";
        if (departmentId) url += `?departmentId=${departmentId}`;
        return url;
      },
      transformResponse: (response: ApiResponse<PerformanceHistoryResponse[]>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getPerformancePulse: builder.query<PerformanceHistoryResponse[], { departmentId?: number | string; employeeId?: number | string; onlyByManager?: boolean; startDate?: string; endDate?: string }>({
      query: ({ departmentId, employeeId, onlyByManager, startDate, endDate }) => {
        let url = "/performance-history/pulse";
        const params = new URLSearchParams();
        if (departmentId) params.append("departmentId", departmentId.toString());
        if (employeeId) params.append("employeeId", employeeId.toString());
        if (onlyByManager !== undefined) params.append("onlyByManager", onlyByManager.toString());
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        const queryStr = params.toString();
        return queryStr ? `${url}?${queryStr}` : url;
      },
      transformResponse: (response: ApiResponse<PerformanceHistoryResponse[]>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getMeetingPulse: builder.query<any, { departmentId?: number | string; employeeId?: number | string; onlyByManager?: boolean; startDate?: string; endDate?: string }>({
      query: ({ departmentId, employeeId, onlyByManager, startDate, endDate }) => {
        let url = "/performance-history/meeting-pulse";
        const params = new URLSearchParams();
        if (departmentId) params.append("departmentId", departmentId.toString());
        if (employeeId) params.append("employeeId", employeeId.toString());
        if (onlyByManager !== undefined) params.append("onlyByManager", onlyByManager.toString());
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        const queryStr = params.toString();
        return queryStr ? `${url}?${queryStr}` : url;
      },
      transformResponse: (response: ApiResponse<any>) => response.data,
      providesTags: ["PerformanceHistory" as any, "OneOnOneMeeting" as any],
    }),
    getDepartmentBenchmarks: builder.query<DepartmentBenchmarksResponse, { startDate?: string; endDate?: string } | void>({
      query: (args) => {
        let url = "/performance-history/department-benchmarks";
        if (args) {
          const params = new URLSearchParams();
          if (args.startDate) params.append("startDate", args.startDate);
          if (args.endDate) params.append("endDate", args.endDate);
          const q = params.toString();
          if (q) url += `?${q}`;
        }
        return url;
      },
      transformResponse: (response: ApiResponse<DepartmentBenchmarksResponse>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getGoalsPulseOverlay: builder.query<GoalsPulseOverlayResponse, { departmentId?: number | string; employeeId?: number | string; startDate?: string; endDate?: string } | void>({
      query: (args) => {
        let url = "/performance-history/goals-overlay";
        if (args) {
          const params = new URLSearchParams();
          if (args.departmentId) params.append("departmentId", args.departmentId.toString());
          if (args.employeeId) params.append("employeeId", args.employeeId.toString());
          if (args.startDate) params.append("startDate", args.startDate);
          if (args.endDate) params.append("endDate", args.endDate);
          const q = params.toString();
          if (q) url += `?${q}`;
        }
        return url;
      },
      transformResponse: (response: ApiResponse<GoalsPulseOverlayResponse>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getEmployeePerformanceHistoryAnalytics: builder.query<PerformanceHistoryResponse[], number>({
      query: (employeeId) => `/performance-history/employee/${employeeId}/raw`,
      transformResponse: (response: ApiResponse<PerformanceHistoryResponse[]>) => response.data,
      providesTags: ["PerformanceHistory" as any],
    }),
    getFeedbackStats: builder.query<ContinuousStatsResponse, number>({
      query: (employeeId) => `/feedbacks/employee/${employeeId}/stats`,
      transformResponse: (response: ApiResponse<ContinuousStatsResponse>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getMeetingStats: builder.query<ContinuousStatsResponse, number>({
      query: (employeeId) => `/meetings/employee/${employeeId}/stats`,
      transformResponse: (response: ApiResponse<ContinuousStatsResponse>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
    getFeedbackStatsForManager: builder.query<ContinuousStatsResponse, number | string>({
      query: (managerId) => `/feedbacks/manager/${managerId}/stats`,
      transformResponse: (response: ApiResponse<ContinuousStatsResponse>) => response.data,
      providesTags: ["ContinuousFeedback" as any],
    }),
    getMeetingStatsForManager: builder.query<ContinuousStatsResponse, number | string>({
      query: (managerId) => `/meetings/manager/${managerId}/stats`,
      transformResponse: (response: ApiResponse<ContinuousStatsResponse>) => response.data,
      providesTags: ["OneOnOneMeeting" as any],
    }),
  }),
});

export const {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackTagMutation,
  useUpdateFeedbackTagMutation,
  useDeleteFeedbackTagMutation,
  useGetFeedbacksByEmployeeQuery,
  useGetFeedbacksByManagerQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useDeleteReplyMutation,
  useGetAllMeetingsQuery,
  useGetMeetingsByEmployeeQuery,
  useGetMeetingsByManagerQuery,
  useScheduleMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
  useDeleteCommentMutation,
  useUpdateReplyMutation,
  useUpdateCommentMutation,
  useGetPerformanceHistoryByEmployeeQuery,
  useGetAllPerformanceHistoryQuery,
  useGetPerformancePulseQuery,
  useGetMeetingPulseQuery,
  useGetDepartmentBenchmarksQuery,
  useGetGoalsPulseOverlayQuery,
  useGetPerformanceHistoryAnalyticsQuery,
  useGetEmployeePerformanceHistoryAnalyticsQuery,
  usePublishFeedbackMutation,
  usePublishMeetingMutation,
  useGetFeedbackStatsQuery,
  useGetMeetingStatsQuery,
  useGetFeedbackStatsForManagerQuery,
  useGetMeetingStatsForManagerQuery,
  useUpdateActionItemStatusMutation,
  useReopenActionItemMutation,
} = continuousApi;
