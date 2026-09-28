export type AudienceType = 'EVERYONE' | 'HR' | 'MENTORS' | 'INTERNS' | 'SPECIFIC';

export type NotificationStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED' | 'FAILED';

export interface SpecificRecipientDetail {
  id: string;
  username: string;
  email: string;
  role: string;
  name: string;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  audience_type: AudienceType;
  audienceType: AudienceType;
  status: NotificationStatus;
  scheduled_for: string | null;
  scheduledFor: string | null;
  time_zone: string;
  timeZone: string;
  sent_at: string | null;
  sentAt: string | null;
  recipient_count: number;
  recipientCount: number;
  failure_reason: string;
  failureReason: string;
  sender: string;
  sender_name: string;
  senderName: string;
  specific_recipients?: string[];
  specific_recipient_details?: SpecificRecipientDetail[];
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

export interface ScheduledNotificationPayload {
  title: string;
  message: string;
  audience_type: AudienceType;
  scheduled_for?: string | null;
  time_zone?: string;
  specific_recipients?: string[];
  action?: 'SEND_NOW' | 'SCHEDULE' | 'SAVE_DRAFT' | string;
}

export interface AudienceCounts {
  EVERYONE: number;
  HR: number;
  MENTORS: number;
  INTERNS: number;
}

export interface AudienceData {
  counts: AudienceCounts;
  users: SpecificRecipientDetail[];
}
