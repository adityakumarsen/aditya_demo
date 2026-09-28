import React, { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Bell,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  Trash2,
  Filter,
  RefreshCw,
  Globe,
  UserCheck,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';
import {
  useGetScheduledNotificationsQuery,
  useGetAudienceDataQuery,
  useCreateScheduledNotificationMutation,
  useUpdateScheduledNotificationMutation,
  useDeleteScheduledNotificationMutation,
  useSendScheduledNotificationNowMutation,
  useCancelScheduledNotificationMutation,
} from '../../features/superadmin/superadminNotificationApi';
import type {
  ScheduledNotification,
  AudienceType,
  NotificationStatus,
} from '../../features/superadmin/superadminNotificationTypes';
import { formatDistanceToNow, format, isBefore, parseISO } from 'date-fns';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'IST - Asia/Kolkata (UTC+5:30)' },
  { value: 'America/New_York', label: 'EST - America/New_York (UTC-5:00)' },
  { value: 'America/Los_Angeles', label: 'PST - America/Los_Angeles (UTC-8:00)' },
  { value: 'Europe/London', label: 'GMT/BST - Europe/London' },
  { value: 'Asia/Singapore', label: 'SGT - Asia/Singapore (UTC+8:00)' },
];

export const SuperadminNotificationPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [viewingNotification, setViewingNotification] = useState<ScheduledNotification | null>(null);

  // RTK Query
  const { data: notifications = [], isLoading, isFetching, refetch } = useGetScheduledNotificationsQuery({
    status: statusFilter,
    search: searchQuery,
  });

  const { data: audienceData } = useGetAudienceDataQuery();

  const [createNotification, { isLoading: isCreating }] = useCreateScheduledNotificationMutation();
  const [updateNotification, { isLoading: isUpdating }] = useUpdateScheduledNotificationMutation();
  const [deleteNotification] = useDeleteScheduledNotificationMutation();
  const [sendNow] = useSendScheduledNotificationNowMutation();
  const [cancelNotification] = useCancelScheduledNotificationMutation();

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formAudience, setFormAudience] = useState<AudienceType>('EVERYONE');
  const [formSpecificUsers, setFormSpecificUsers] = useState<string[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'NOW' | 'SCHEDULE'>('NOW');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [timeZone, setTimeZone] = useState('UTC');
  const [formError, setFormError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Stats calculation
  const stats = useMemo(() => {
    const total = notifications.length;
    const scheduled = notifications.filter((n) => n.status === 'SCHEDULED').length;
    const sent = notifications.filter((n) => n.status === 'SENT').length;
    const drafts = notifications.filter((n) => n.status === 'DRAFT' || n.status === 'CANCELLED').length;
    return { total, scheduled, sent, drafts };
  }, [notifications]);

  // Open modal in create mode
  const handleOpenCreate = () => {
    setEditingNotification(null);
    setFormTitle('');
    setFormMessage('');
    setFormAudience('EVERYONE');
    setFormSpecificUsers([]);
    setDeliveryMode('NOW');
    // Default tomorrow at 09:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
    setScheduledTime('09:00');
    setTimeZone('UTC');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleOpenEdit = (n: ScheduledNotification) => {
    setEditingNotification(n);
    setFormTitle(n.title);
    setFormMessage(n.message);
    setFormAudience(n.audience_type || n.audienceType || 'EVERYONE');
    setFormSpecificUsers(n.specific_recipients || n.specific_recipient_details?.map(u => u.id) || []);
    if (n.scheduled_for || n.scheduledFor) {
      setDeliveryMode('SCHEDULE');
      try {
        const dt = new Date(n.scheduled_for || n.scheduledFor || '');
        setScheduledDate(format(dt, 'yyyy-MM-dd'));
        setScheduledTime(format(dt, 'HH:mm'));
      } catch {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
        setScheduledTime('09:00');
      }
    } else {
      setDeliveryMode('NOW');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
      setScheduledTime('09:00');
    }
    setTimeZone(n.time_zone || n.timeZone || 'UTC');
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit modal (Create or Update)
  const handleSubmit = async (actionOverride?: 'SEND_NOW' | 'SCHEDULE' | 'SAVE_DRAFT') => {
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Please enter a notification title.');
      return;
    }
    if (!formMessage.trim()) {
      setFormError('Please enter the notification message body.');
      return;
    }
    if (formAudience === 'SPECIFIC' && formSpecificUsers.length === 0) {
      setFormError('Please select at least one specific recipient.');
      return;
    }

    let finalAction = actionOverride || (deliveryMode === 'NOW' ? 'SEND_NOW' : 'SCHEDULE');

    let isoScheduledFor: string | null = null;
    if (finalAction === 'SCHEDULE') {
      if (!scheduledDate || !scheduledTime) {
        setFormError('Please choose both a date and time for scheduled delivery.');
        return;
      }
      const combinedDateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
      const parsedDate = new Date(combinedDateTimeStr);
      if (isNaN(parsedDate.getTime())) {
        setFormError('Invalid date or time provided.');
        return;
      }
      if (isBefore(parsedDate, new Date())) {
        setFormError('Cannot schedule a notification in the past. Please choose a future time.');
        return;
      }
      isoScheduledFor = parsedDate.toISOString();
    }

    const payload = {
      title: formTitle.trim(),
      message: formMessage.trim(),
      audience_type: formAudience,
      scheduled_for: isoScheduledFor,
      time_zone: timeZone,
      specific_recipients: formAudience === 'SPECIFIC' ? formSpecificUsers : [],
      action: finalAction,
    };

    try {
      if (editingNotification) {
        await updateNotification({ id: editingNotification.id, payload }).unwrap();
        toast.success(finalAction === 'SEND_NOW' ? 'Notification dispatched immediately!' : 'Notification updated successfully.');
      } else {
        await createNotification(payload).unwrap();
        toast.success(
          finalAction === 'SEND_NOW'
            ? 'Notification sent immediately to recipients!'
            : finalAction === 'SCHEDULE'
            ? 'Notification successfully scheduled!'
            : 'Notification saved as draft.'
        );
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.data?.message || err?.data?.scheduled_for?.[0] || 'Failed to save notification.';
      setFormError(msg);
      toast.error(msg);
    }
  };

  const handleSendNowConfirm = async (n: ScheduledNotification) => {
    if (!window.confirm(`Send "${n.title}" immediately to all intended recipients?`)) return;
    try {
      await sendNow(n.id).unwrap();
      toast.success('Notification delivered successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to dispatch notification.');
    }
  };

  const handleCancelConfirm = async (n: ScheduledNotification) => {
    if (!window.confirm(`Cancel scheduled delivery for "${n.title}"?`)) return;
    try {
      await cancelNotification(n.id).unwrap();
      toast.success('Scheduled notification cancelled.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel notification.');
    }
  };

  const handleDeleteConfirm = async (n: ScheduledNotification) => {
    if (!window.confirm(`Delete "${n.title}"? This action cannot be undone.`)) return;
    try {
      await deleteNotification(n.id).unwrap();
      toast.success('Notification deleted.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete notification.');
    }
  };

  // Filtered users for specific selector
  const availableUsers = audienceData?.users || [];
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return availableUsers;
    const q = userSearch.toLowerCase();
    return availableUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [availableUsers, userSearch]);

  const toggleUserSelection = (userId: string) => {
    if (formSpecificUsers.includes(userId)) {
      setFormSpecificUsers(formSpecificUsers.filter((id) => id !== userId));
    } else {
      setFormSpecificUsers([...formSpecificUsers, userId]);
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} />
            Sent
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock size={12} />
            Scheduled
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <FileEdit size={12} />
            Draft
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <XCircle size={12} />
            Cancelled
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getAudienceBadge = (n: ScheduledNotification) => {
    const type = n.audience_type || n.audienceType;
    switch (type) {
      case 'EVERYONE':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            <Globe size={12} className="text-blue-500" /> Everyone
          </span>
        );
      case 'HR':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
            <UserCheck size={12} className="text-purple-500" /> HR Personnel
          </span>
        );
      case 'MENTORS':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
            <Briefcase size={12} className="text-indigo-500" /> Mentors / Managers
          </span>
        );
      case 'INTERNS':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            <GraduationCap size={12} className="text-emerald-500" /> Interns
          </span>
        );
      case 'SPECIFIC':
        const count = n.specific_recipients?.length || n.specific_recipient_details?.length || n.recipient_count || n.recipientCount || 0;
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
            <Users size={12} className="text-amber-500" /> Specific ({count} users)
          </span>
        );
      default:
        return <span className="text-xs font-semibold text-slate-600">{type}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Bell size={24} />
            </div>
            Announcements & Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, schedule, target, and broadcast global system notifications and team announcements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh announcements"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-indigo-600' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus size={18} />
            Create Notification
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Broadcasts</span>
            <Bell size={16} className="text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">All historical logs</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs font-medium">
            <span>Active Scheduled</span>
            <Clock size={16} className="text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-700">{stats.scheduled}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Awaiting automatic delivery</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-medium">
            <span>Delivered & Sent</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{stats.sent}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Received by targeted users</div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Drafts & Cancelled</span>
            <FileEdit size={16} className="text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700">{stats.drafts}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Unsent notifications</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'SCHEDULED', label: 'Scheduled' },
            { id: 'SENT', label: 'Sent' },
            { id: 'DRAFT', label: 'Draft' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center">
            <RefreshCw size={24} className="mx-auto text-indigo-600 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto px-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Bell size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No notifications found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first broadcast announcement.'}
            </p>
            {(!searchQuery && statusFilter === 'ALL') && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={14} />
                Create Notification
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Title & Content</th>
                  <th className="py-3.5 px-4">Audience</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Delivery Timing</th>
                  <th className="py-3.5 px-4">Recipients</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notifications.map((n) => {
                  const isScheduled = n.status === 'SCHEDULED';
                  const isDraft = n.status === 'DRAFT';
                  const isSent = n.status === 'SENT';
                  const isCancelled = n.status === 'CANCELLED';

                  return (
                    <tr key={n.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                        <div className="font-bold text-slate-900 truncate">{n.title}</div>
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          By: {n.sender_name || n.senderName || 'Super Admin'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getAudienceBadge(n)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(n.status)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSent ? (
                          <div>
                            <div className="font-medium text-slate-700">
                              {n.sent_at || n.sentAt ? format(new Date(n.sent_at || n.sentAt || ''), 'MMM d, yyyy h:mm a') : 'Delivered'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {n.sent_at || n.sentAt ? formatDistanceToNow(new Date(n.sent_at || n.sentAt || ''), { addSuffix: true }) : ''}
                            </div>
                          </div>
                        ) : isScheduled ? (
                          <div>
                            <div className="font-medium text-indigo-700">
                              {n.scheduled_for || n.scheduledFor
                                ? format(new Date(n.scheduled_for || n.scheduledFor || ''), 'MMM d, yyyy h:mm a')
                                : 'Pending'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Zone: {n.time_zone || n.timeZone || 'UTC'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 font-medium">
                            Created {formatDistanceToNow(new Date(n.created_at || n.createdAt), { addSuffix: true })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {isSent ? `${n.recipient_count || n.recipientCount} delivered` : 'Ready to target'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        {isScheduled && (
                          <>
                            <button
                              onClick={() => handleSendNowConfirm(n)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Send now immediately"
                            >
                              Send Now
                            </button>
                            <button
                              onClick={() => handleOpenEdit(n)}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Edit notification"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelConfirm(n)}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Cancel scheduled delivery"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {isDraft && (
                          <>
                            <button
                              onClick={() => handleSendNowConfirm(n)}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Send draft now"
                            >
                              Send Now
                            </button>
                            <button
                              onClick={() => handleOpenEdit(n)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Edit draft"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(n)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                              title="Delete draft"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {isCancelled && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(n)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                              title="Re-schedule or edit"
                            >
                              Re-schedule
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(n)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors inline-flex items-center"
                              title="Delete cancelled notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}

                        {isSent && (
                          <button
                            onClick={() => setViewingNotification(n)}
                            className="px-2.5 py-1 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-[11px] transition-colors"
                          >
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="text-indigo-600" size={20} />
                  {editingNotification ? 'Edit Scheduled Notification' : 'Create New Notification'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Compose your announcement, select the target audience, and configure delivery timing.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Performance Review Deadline Reminder"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={255}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Message Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Type the full announcement message here..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
                />
              </div>

              {/* Audience Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'EVERYONE', label: 'Everyone', desc: 'All active users', count: audienceData?.counts?.EVERYONE ?? 0, icon: Globe },
                    { id: 'HR', label: 'HR Personnel', desc: 'HR Administrators', count: audienceData?.counts?.HR ?? 0, icon: UserCheck },
                    { id: 'MENTORS', label: 'Mentors / Managers', desc: 'Supervisors & Leads', count: audienceData?.counts?.MENTORS ?? 0, icon: Briefcase },
                    { id: 'INTERNS', label: 'Interns', desc: 'All active interns', count: audienceData?.counts?.INTERNS ?? 0, icon: GraduationCap },
                    { id: 'SPECIFIC', label: 'Specific Users', desc: 'Custom pick', count: formSpecificUsers.length, icon: Users },
                  ].map((aud) => {
                    const isSelected = formAudience === aud.id;
                    const Icon = aud.icon;
                    return (
                      <button
                        key={aud.id}
                        type="button"
                        onClick={() => setFormAudience(aud.id as AudienceType)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon size={16} className={isSelected ? 'text-indigo-600' : 'text-slate-400'} />
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {aud.count}
                          </span>
                        </div>
                        <div className="font-bold text-xs">{aud.label}</div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">{aud.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Users Picker if SPECIFIC selected */}
              {formAudience === 'SPECIFIC' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Select Users ({formSpecificUsers.length} selected)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormSpecificUsers(availableUsers.map((u) => u.id))}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFormSpecificUsers([])}
                        className="text-[11px] font-semibold text-slate-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Filter by name, email, or role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />

                  <div className="max-h-44 overflow-y-auto divide-y divide-slate-200 bg-white rounded-lg border border-slate-200">
                    {filteredUsers.map((user) => {
                      const checked = formSpecificUsers.includes(user.id);
                      return (
                        <label
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUserSelection(user.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <div className="font-semibold text-slate-900">{user.name}</div>
                              <div className="text-[10px] text-slate-400">{user.email}</div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {user.role}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delivery Timing */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Delivery Timing
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={deliveryMode === 'NOW'}
                      onChange={() => setDeliveryMode('NOW')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Send Immediately</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="deliveryMode"
                      checked={deliveryMode === 'SCHEDULE'}
                      onChange={() => setDeliveryMode('SCHEDULE')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>

                {deliveryMode === 'SCHEDULE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Delivery Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Time Zone
                      </label>
                      <select
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        {TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4.5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSubmit('SAVE_DRAFT')}
                disabled={isCreating || isUpdating}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Save as Draft
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isCreating || isUpdating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  {isCreating || isUpdating ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : deliveryMode === 'NOW' ? (
                    <Send size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                  {deliveryMode === 'NOW' ? 'Send Immediately' : 'Schedule Notification'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {viewingNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <CheckCircle2 size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Delivery Report</h3>
              </div>
              <button
                onClick={() => setViewingNotification(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Title</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{viewingNotification.title}</div>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Message</span>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700 mt-1 whitespace-pre-wrap">
                  {viewingNotification.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Audience</span>
                  <div className="mt-0.5">{getAudienceBadge(viewingNotification)}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Total Delivered</span>
                  <div className="font-bold text-emerald-700 mt-0.5">
                    {viewingNotification.recipient_count || viewingNotification.recipientCount} Recipients
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Sent At</span>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {viewingNotification.sent_at || viewingNotification.sentAt
                      ? format(new Date(viewingNotification.sent_at || viewingNotification.sentAt || ''), 'PPpp')
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase text-[10px]">Sender</span>
                  <div className="font-medium text-slate-800 mt-0.5">
                    {viewingNotification.sender_name || viewingNotification.senderName || 'Super Admin'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingNotification(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperadminNotificationPage;
