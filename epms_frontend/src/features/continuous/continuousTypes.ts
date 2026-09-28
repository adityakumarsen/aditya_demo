export const FeedbackType = {
  PRAISE: 'PRAISE',
  IMPROVEMENT: 'IMPROVEMENT',
  WARNING: 'WARNING',
} as const;

export type FeedbackType = typeof FeedbackType[keyof typeof FeedbackType];

export const CommentType = {
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type CommentType = typeof CommentType[keyof typeof CommentType];

export const ContinuousStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ContinuousStatus = typeof ContinuousStatus[keyof typeof ContinuousStatus];

export const ActionItemStatus = {
  PENDING: 'PENDING',
  DONE: 'DONE',
} as const;

export type ActionItemStatus = typeof ActionItemStatus[keyof typeof ActionItemStatus];

export interface FeedbackTagResponse {
  tagId: number;
  tagName: string;
}

export interface FeedbackTagRequest {
  tagName: string;
}

export interface ContinuousFeedbackResponse {
  feedbackId: number | string;
  id?: string;
  employeeId: number | string;
  employeeName: string;
  managerId: number | string;
  managerName: string;
  feedbackType: FeedbackType;
  tag: FeedbackTagResponse;
  description: string;

  status: ContinuousStatus;
  createdBy: number | string;
  replyCount?: number;
  createdAt: string;
  publishedAt?: string; // Set when the draft is published; null if created directly as published (use createdAt fallback)
}

export interface ContinuousFeedbackRequest {
  employeeId: number | string;
  managerId?: number | string;
  feedbackType: FeedbackType;
  tagId: number;
  description: string;

  status?: ContinuousStatus;
}

export interface FeedbackReplyResponse {
  replyId: number | string;
  feedbackId: number | string;
  employeeId: number | string;
  employeeName: string;
  replyText: string;
  parentId?: number | string;
  children?: FeedbackReplyResponse[];
  createdAt: string;
}

export interface FeedbackReplyRequest {
  employeeId?: number | string;
  replyText: string;
  parentId?: number | string;
}

export interface MeetingActionItemRequest {
  id?: number;
  content: string;
  status?: ActionItemStatus;
  assignedToId?: number;
  dueDate?: string;
}

export interface MeetingActionItemResponse {
  id: number;
  content: string;
  status: ActionItemStatus;
  completedAt?: string;
  reopenReason?: string;
  assignedToId?: number;
  assignedToName?: string;
  dueDate?: string;
}

export interface OneOnOneMeetingResponse {
  meetingId: number;
  employeeId: number;
  employeeName: string;
  managerId: number;
  managerName: string;
  meetingTitle?: string;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: MeetingActionItemResponse[];
  followUpDate?: string;

  status: ContinuousStatus;
  createdBy: number;
  commentCount?: number;
  createdAt: string;
  publishedAt?: string; // Set when the draft is published; null if created directly as published (use createdAt fallback)
}

export interface OneOnOneMeetingRequest {
  employeeId: number;
  managerId: number;
  meetingTitle?: string;
  meetingDate: string;
  meetingTime: string;
  discussionPoints: string;
  keyIssues: string;
  actionItems: MeetingActionItemRequest[];
  followUpDate?: string;

  status?: ContinuousStatus;
}

export interface MeetingCommentResponse {
  id: number;
  meetingId: number;
  employeeId?: number;
  employeeName?: string;
  managerId?: number;
  managerName?: string;
  comment: string;
  commentType: CommentType;
  parentId?: number;
  createdAt: string;
}

export interface MeetingCommentRequest {
  employeeId?: number;
  managerId?: number;
  comment: string;
  commentType: CommentType;
  parentId?: number;
}

export interface PerformanceHistoryResponse {
  historyId: number;
  id?: string;
  employeeId: number | string;
  employeeName: string;
  managerId: number | string;
  managerName: string;
  performerId: number | string;
  performerName: string;
  sourceType: 'FEEDBACK' | 'MEETING';
  sourceId: number | string;
  title: string;
  description: string;
  feedbackType?: FeedbackType;
  tagName?: string;

  createdAt: string;
}

export interface ContinuousStatsResponse {
  totalPublished: number;
  totalDraft: number;
}

export interface DepartmentBenchmarkItem {
  departmentId: string;
  departmentName: string;
  headcount: number;
  totalActivities: number;
  activitiesPerEmployee: number;
  sentimentDistribution: {
    praise: number;
    improvement: number;
    warning: number;
    praisePercentage: number;
    improvementPercentage: number;
    warningPercentage: number;
  };
  goals: {
    total: number;
    completed: number;
    completionRate: number;
    averageCompletionPercentage: number;
  };
}

export interface DepartmentBenchmarksResponse {
  companyAverage: {
    totalHeadcount: number;
    totalActivities: number;
    activitiesPerEmployee: number;
    totalGoals: number;
    completedGoals: number;
    averageGoalCompletionPercentage: number;
    goalCompletionRate: number;
  };
  departments: DepartmentBenchmarkItem[];
}

export interface GoalKpiItem {
  id: string;
  name: string;
  targetValue: number;
  achievedValue: number;
  unit: string;
}

export interface GoalOverlayItem {
  id: string;
  title: string;
  employeeName: string;
  departmentName: string;
  dueDate: string;
  status: string;
  completionPercentage: number;
  priority: string;
  kpis: GoalKpiItem[];
}

export interface MonthlyGoalOverlayItem {
  name: string;
  year: number;
  month: number;
  averageProgress: number;
  totalGoals: number;
  completedGoals: number;
}

export interface GoalsPulseOverlayResponse {
  summary: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    notStartedGoals: number;
    averageCompletionPercentage: number;
    completionRate: number;
  };
  monthlyOverlay: MonthlyGoalOverlayItem[];
  goals: GoalOverlayItem[];
}