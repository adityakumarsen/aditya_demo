export interface NotificationResponse {
  id: string | number;
  title: string;
  message: string;
  type?: string;
  notification_type?: string;
  referenceType?: string;
  referenceId?: number;
  actionUrl?: string;
  isRead: boolean;
  is_read?: boolean;
  createdAt: string;
  created_at?: string;
  senderName?: string;
  sender_name?: string;
  senderRole?: string;
  sender_role?: string;
  deliveryTime?: string;
  delivery_time?: string;
}

export interface NotificationState {
  notifications: NotificationResponse[];
  unreadCount: number;
}
