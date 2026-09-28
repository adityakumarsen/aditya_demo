import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { useAuth } from "../../hooks/useAuth";
import {
  useGetAllMeetingsQuery,
  useScheduleMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
  usePublishMeetingMutation,
  useGetMeetingStatsForManagerQuery,
  useUpdateActionItemStatusMutation,
  useReopenActionItemMutation,
  useGetMeetingsByEmployeeQuery,
  useGetMeetingsByManagerQuery,
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { ContinuousStatus, ActionItemStatus } from "../../features/continuous/continuousTypes";
import { format } from "date-fns";
import { formatRelativeTime } from "../../utils/timeUtils";

const inputStyle: React.CSSProperties = {
  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12,
  padding: '8px 14px', fontSize: 13, color: '#0F172A', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  transition: 'all 0.2s ease',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
};
const panelStyle: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, padding: '20px 24px',
  boxShadow: '0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04)',
};

const officeStyles = `
  .office-panel {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .office-panel:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px -4px rgba(99, 102, 241, 0.08), 0 4px 12px -2px rgba(99, 102, 241, 0.04);
    border-color: rgba(99, 102, 241, 0.25);
  }
  .office-feed-card {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 20px 24px;
    box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .office-feed-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px -4px rgba(99, 102, 241, 0.08), 0 4px 12px -2px rgba(99, 102, 241, 0.04);
    border-color: rgba(99, 102, 241, 0.25);
  }
  .office-input {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 8px 14px;
    font-size: 13px;
    color: #0F172A;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  .office-input:focus {
    background: #FFFFFF;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  .office-button-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #6366F1;
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .office-button-primary:hover {
    background: #4F46E5;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.25);
  }
  .office-button-primary:active {
    transform: translateY(0);
  }
  .office-button-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: #F8FAFC;
    color: #475569;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 9px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .office-button-secondary:hover {
    background: #F1F5F9;
    color: #1E293B;
    border-color: #CBD5E1;
  }
  .office-tag-badge {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 10px;
    font-weight: 600;
    background: #F1F5F9;
    color: #475569;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    padding: 2px 8px;
    display: inline-block;
    letter-spacing: -0.2px;
  }
  .office-avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  }
  .office-avatar-circle:hover {
    transform: scale(1.05);
  }
  .office-tab-active {
    background: #6366F1 !important;
    color: #FFFFFF !important;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2) !important;
  }
  .office-pill-filter {
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }
  .office-pill-filter:hover {
    border-color: #CBD5E1;
  }
`;

const CommentItem = ({
  comment, allComments, user, isManager, highlightedCommentId,
  editingCommentId, editCommentText, setEditCommentText, setEditingCommentId,
  handleUpdateComment, handleScrollToParent, onContextMenu, isUpdatingComment
}: {
  comment: any; allComments: any[]; user: any; isManager: boolean;
  highlightedCommentId: number | null; editingCommentId: number | null;
  editCommentText: string; setEditCommentText: (val: string) => void;
  setEditingCommentId: (val: number | null) => void;
  handleUpdateComment: (id: number) => void;
  handleScrollToParent: (parentId: number) => void;
  onContextMenu: (e: React.MouseEvent, comment: any) => void;
  isUpdatingComment: boolean;
}) => {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingCommentId === comment.id && editTextareaRef.current) {
      const el = editTextareaRef.current;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [editingCommentId, comment.id]);
  const isOwnComment = (isManager && comment.commentType === 'MANAGER' && comment.managerId === user?.id) ||
                       (!isManager && comment.commentType === 'EMPLOYEE' && comment.employeeId === user?.id);
  const isHighlighted = highlightedCommentId === comment.id;

  const bubbleStyle: React.CSSProperties = isOwnComment
    ? { background: '#6366F1', color: '#FFFFFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', minWidth: 120, position: 'relative', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }
    : { background: '#F1F5F9', color: '#1E293B', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', minWidth: 120, position: 'relative', boxShadow: '0 2px 8px rgba(148,163,184,0.04)', border: '1px solid #E2E8F0' };

  const avatarBg = isOwnComment || isHighlighted ? '#6366F1' : '#E2E8F0';
  const avatarText = isOwnComment || isHighlighted ? '#FFFFFF' : '#475569';

  return (
    <div 
      id={`comment-${comment.id}`} 
      className={`space-y-2`}
      onContextMenu={(e) => onContextMenu(e, comment)}
    >
      <div className={`flex gap-3 px-3 py-2 rounded-2xl transition-all duration-300 group relative ${
        isHighlighted 
          ? 'bg-indigo-50/70 ring-2 ring-indigo-500/20 scale-[1.01]' 
          : isOwnComment ? 'flex-row-reverse bg-indigo-50/10 border-r-2 border-indigo-500' : 'bg-slate-50/20'
      }`}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: avatarBg, color: avatarText, border: isOwnComment || isHighlighted ? 'none' : '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          {(comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)?.charAt(0)}
        </div>
        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isOwnComment ? 'flex-end' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {isOwnComment ? 'You' : (comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)}
            </span>
            {comment.commentType === 'MANAGER' && <span className="office-tag-badge" style={{ background: '#4F46E5', color: '#FFFFFF', border: 'none', fontSize: 8, padding: '1px 5px' }}>Manager</span>}
            <span style={{ fontSize: 9, color: '#64748B' }}>{comment.createdAt ? format(new Date(comment.createdAt), 'h:mm a') : ''}</span>
          </div>

          <div style={bubbleStyle} className="group ">
            <button onClick={(e) => onContextMenu(e as any, comment)}
              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: isOwnComment ? '#C7D2FE' : '#94A3B8', cursor: 'pointer', padding: 2, display: 'flex' }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {comment.parentId && (() => {
              const parent = allComments?.find(c => String(c.id) === String(comment.parentId));
              if (!parent) return null;
              const parentName = parent.commentType === 'MANAGER' ? parent.managerName : parent.employeeName;
              return (
                <div onClick={() => handleScrollToParent(parent.id)}
                  style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 8, borderLeft: '3px solid #6366F1', background: isOwnComment ? 'rgba(255,255,255,0.15)' : '#F1F5F9', cursor: 'pointer' }}
                  className="hover:opacity-90 transition-opacity">
                  <div style={{ fontSize: 9, fontWeight: 700, color: isOwnComment ? '#FFFFFF' : '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{parentName}</div>
                  <div style={{ fontSize: 10, color: isOwnComment ? '#CBD5E1' : '#475569', fontStyle: 'italic' }} className="line-clamp-2">"{parent.comment}"</div>
                </div>
              );
            })()}

            {editingCommentId === comment.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea ref={editTextareaRef} className="office-input" style={{ height: 60, resize: 'none', padding: '6px 8px', minWidth: 150 }}
                  maxLength={2000}
                  value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingCommentId(null)} className="office-button-secondary" style={{ fontSize: 10, padding: '4px 8px' }}>Cancel</button>
                  <button disabled={isUpdatingComment} onClick={() => handleUpdateComment(comment.id)}
                    className="office-button-primary" style={{ fontSize: 10, padding: '4px 8px', opacity: isUpdatingComment ? 0.5 : 1 }}>
                    {isUpdatingComment ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 13, color: isOwnComment ? '#FFFFFF' : '#0F172A', lineHeight: 1.5 }}>{comment.comment}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: isOwnComment ? '#C7D2FE' : '#64748B' }}>{formatRelativeTime(comment.createdAt)}</span>
                  {isOwnComment && <svg style={{ width: 10, height: 10, color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MeetingPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  const canSchedule = isManager;
  const todayStr = new Date().toISOString().split('T')[0];

  const [perspective, setPerspective] = useState<'all' | 'received' | 'given'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const { data: allResponse, isLoading: isLoadingAll } = useGetAllMeetingsQuery(
    { page: currentPage - 1, size: itemsPerPage, status: filterStatus },
    { skip: !user || perspective !== 'all' }
  );

  const { data: employeeResponse, isLoading: isLoadingEmp } = useGetMeetingsByEmployeeQuery(
    { employeeId: user?.id || 0, page: currentPage - 1, size: itemsPerPage },
    { skip: !user || perspective !== 'received' }
  );

  const { data: managerResponse, isLoading: isLoadingMgr } = useGetMeetingsByManagerQuery(
    { managerId: user?.id || 0, status: filterStatus, page: currentPage - 1, size: itemsPerPage },
    { skip: !user || perspective !== 'given' }
  );

  const meetingResponse = perspective === 'all' ? allResponse : perspective === 'received' ? employeeResponse : managerResponse;
  const isLoading = perspective === 'all' ? isLoadingAll : perspective === 'received' ? isLoadingEmp : isLoadingMgr;

  const meetings = meetingResponse?.content || [];
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];

  const deptEmployees = employees?.filter(emp =>
    emp.currentDepartmentName && user?.currentDepartmentName &&
    emp.currentDepartmentName === user?.currentDepartmentName
  ) || [];
  // Include the logged-in user's own rank since they are excluded from the
  // employees list (excludeSelf=true). Without this, the next person below
  // them becomes minRankInDept and gets incorrectly filtered out.
  const allDeptRanks = [
    ...deptEmployees.map(emp => emp.levelRank ?? 9999),
    user?.levelRank ?? 9999
  ];
  const minRankInDept = allDeptRanks.length > 0
    ? Math.min(...allDeptRanks)
    : 9999;

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp =>
        emp.currentDepartmentName && user?.currentDepartmentName &&
        emp.currentDepartmentName === user?.currentDepartmentName &&
        emp.id !== user?.id &&
        (emp.levelRank === undefined || emp.levelRank === null || emp.levelRank !== minRankInDept) &&
        (emp.levelRank === undefined || emp.levelRank === null || user?.levelRank === undefined || user?.levelRank === null || emp.levelRank >= user.levelRank)
      );

  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();
  const [publishMeeting, { isLoading: isPublishing }] = usePublishMeetingMutation();
  const [updateActionItemStatus] = useUpdateActionItemStatusMutation();
  const [reopenActionItem] = useReopenActionItemMutation();
  const { data: meetingStats } = useGetMeetingStatsForManagerQuery(user?.id || 0, { skip: !user?.id });

  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<{ id: number; name: string } | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<number | null>(null);
  const [reopenConfig, setReopenConfig] = useState<{ meetingId: number, item: any } | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  interface MeetingState {
    employeeId: number;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    discussionPoints: string;
    keyIssues: string;
    actionItems: { id?: number; content: string; status?: string; assignedToId?: number; dueDate?: string }[];
    followUpDate: string;
  }

  const [newMeeting, setNewMeeting] = useState<MeetingState>({
    employeeId: 0,
    meetingTitle: "",
    meetingDate: "",
    meetingTime: "",
    discussionPoints: "",
    keyIssues: "",
    actionItems: [],
    followUpDate: "",
  });


  const handleSchedule = async (e: React.FormEvent, status: ContinuousStatus = ContinuousStatus.PUBLISHED) => {
    if (e) e.preventDefault();

    if (!newMeeting.employeeId || !newMeeting.meetingDate || !newMeeting.meetingTime || !newMeeting.discussionPoints || !newMeeting.keyIssues || newMeeting.actionItems.length === 0 || !user) {
      toast.warning("Please fill out all required fields: Employee, Date, Time, Discussion Points, Key Issues, and Action Items.");
      return;
    }
    if (newMeeting.followUpDate && newMeeting.followUpDate < newMeeting.meetingDate) {
      toast.warning("Follow up date cannot be earlier than the meeting date.");
      return;
    }

    for (const item of newMeeting.actionItems) {
      if (item.content.trim() !== '') {
        if (!item.dueDate) {
          toast.warning("All active action items must have a due date.");
          return;
        }
        if (item.dueDate < newMeeting.meetingDate) {
          toast.warning(`Action Item due date (${item.dueDate}) cannot be earlier than the meeting date (${newMeeting.meetingDate}).`);
          return;
        }
        if (newMeeting.followUpDate && item.dueDate > newMeeting.followUpDate) {
          toast.warning(`Action Item due date (${item.dueDate}) cannot be later than the follow-up date (${newMeeting.followUpDate}).`);
          return;
        }
      }
    }
    try {
      const body = {
        ...newMeeting,
        managerId: user.id,
        status: editingId ? undefined : status,
        actionItems: newMeeting.actionItems
          .map(item => ({
            id: item.id || undefined,
            content: (item.content ?? '').trim(),
            status: (item.status || 'PENDING') as ActionItemStatus,
            assignedToId: item.assignedToId || newMeeting.employeeId,
            dueDate: item.dueDate,
          }))
          .filter(item => item.content !== ''),
      };
      if (editingId) {
        await updateMeeting({ id: editingId, body }).unwrap();
      } else {
        await scheduleMeeting(body).unwrap();
      }
      setShowModal(false);
      setEditingId(null);
      setNewMeeting({
        employeeId: 0,
        meetingTitle: "",
        meetingDate: "",
        meetingTime: "",
        discussionPoints: "",
        keyIssues: "",
        actionItems: [],
        followUpDate: "",
      });
    } catch (err: any) {
      toast.error("Failed to save meeting.");
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.meetingId);
    const emp = filteredEmployees?.find(e => e.id === m.employeeId);
    setEditingEmployee({ id: m.employeeId, name: emp?.staffName || m.employeeName || 'Unknown' });
    setNewMeeting({
      employeeId: m.employeeId,
      meetingTitle: m.meetingTitle || "",
      meetingDate: m.meetingDate,
      meetingTime: m.meetingTime.substring(0, 5),
      discussionPoints: m.discussionPoints,
      keyIssues: m.keyIssues,
      actionItems: m.actionItems || [],
      followUpDate: m.followUpDate || "",
    });
    setShowModal(true);
  };

  const handlePublish = async (id: number) => {
    try {
      await publishMeeting(id).unwrap();
    } catch (err: any) {
      alert("Failed to publish meeting.");
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteMeeting(meetingToDelete).unwrap();
      setMeetingToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete meeting.");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPage("");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) handlePageChange(pageNum);
    else setGoToPage("");
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #E4E6EC', borderTopColor: '#1A56DB', borderRadius: '50%' }} className="animate-spin" />
    </div>
  );

  const totalItems = meetingResponse?.totalElements || 0;
  const totalPages = meetingResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + meetings.length;

  const btnPageStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
    background: active ? '#1A56DB' : 'transparent', color: active ? '#FFFFFF' : '#9EA3B0',
  });  return (
    <div className="space-y-6 pb-12">
      <style>{officeStyles}</style>

      {/* Header */}
      <div className="office-panel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>1-on-1 Meetings</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Schedule, record, and track developmental conversations.</p>
        </div>
        {canSchedule && (
          <button onClick={() => setShowModal(true)} className="office-button-primary">
            <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Schedule Meeting
          </button>
        )}
      </div>

      {isManager && (
        <div className="space-y-4">
          {/* Perspective selector tabs */}
          <div className="bg-slate-100 border border-slate-200/60 rounded-2xl p-1.5 flex gap-2 w-fit shadow-inner">
            <button
              onClick={() => { setPerspective('all'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                perspective === 'all'
                  ? 'office-tab-active bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Interactions
            </button>
            <button
              onClick={() => { setPerspective('received'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                perspective === 'received'
                  ? 'office-tab-active bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Meetings Received
            </button>
            <button
              onClick={() => { setPerspective('given'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${
                perspective === 'given'
                  ? 'office-tab-active bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Meetings Conducted (Given)
            </button>
          </div>

          {/* Draft/Published filter (only applicable for given or all) */}
          {perspective !== 'received' && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => { setFilterStatus(undefined); setCurrentPage(1); }}
                className={`office-pill-filter ${!filterStatus ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
              >
                All Statuses
              </button>
              <button
                onClick={() => { setFilterStatus(ContinuousStatus.PUBLISHED); setCurrentPage(1); }}
                className={`office-pill-filter ${filterStatus === ContinuousStatus.PUBLISHED ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
              >
                Published Only
              </button>
              <button
                onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
                className={`office-pill-filter ${filterStatus === ContinuousStatus.DRAFT ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'}`}
              >
                Drafts Only
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="office-panel flex items-center gap-5 hover:scale-[1.01]">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              {perspective === 'received' ? 'Received Published' : perspective === 'given' ? 'Given Published' : isManager ? 'Total Published' : 'Total Received'}
            </p>
            <h3 className="text-2xl font-black text-slate-800">
              {perspective === 'received' ? (meetingResponse?.totalElements || 0) : perspective === 'given' ? (meetingStats?.totalPublished || 0) : isManager ? (meetingStats?.totalPublished || 0) : totalItems}
            </h3>
          </div>
        </div>

        <div className="office-panel flex items-center gap-5 hover:scale-[1.01] group">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Follow up Tasks</p>
            <h3 className="text-2xl font-black text-slate-800">{meetings?.filter(m => m.status === ContinuousStatus.PUBLISHED && m.followUpDate).length || 0}</h3>
          </div>
        </div>

        {isManager && perspective !== 'received' && (
          <button 
            onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
            className="office-panel flex items-center gap-5 hover:scale-[1.01] group text-left w-full border-dashed"
          >
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Drafts</p>
              <h3 className="text-2xl font-black text-amber-600">{meetingStats?.totalDraft || 0}</h3>
            </div>
          </button>
        )}
      </div>

      {/* Meeting List */}
      <div className="space-y-4">
        {meetings?.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 20 }}>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>No meetings scheduled yet.</p>
          </div>
        )}
        {meetings?.map((m) => (
          <div key={m.meetingId} className="office-feed-card group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="office-avatar-circle bg-indigo-50 text-indigo-600 border border-indigo-100" style={{ width: 42, height: 42, borderRadius: 12, fontSize: 16 }}>
                  {(m.employeeId === user?.id ? m.managerName : m.employeeName)?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
                    {m.employeeId === user?.id ? `1-on-1 with ${m.managerName}` : m.employeeName}
                    {m.employeeId === user?.id && <span style={{ color: '#64748B', fontWeight: 500, marginLeft: 6, fontSize: 11 }}>(Received)</span>}
                  </h3>
                  {m.meetingTitle && (
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 1 }}>{m.meetingTitle}</p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }} className="office-tag-badge">
                      <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {format(new Date(m.meetingDate), 'dd/MM/yyyy')}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }} className="office-tag-badge">
                      <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {m.meetingTime}
                    </span>
                    {m.followUpDate && (
                      <span className="office-tag-badge" style={{ fontSize: 11, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                        <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Follow up: {format(new Date(m.followUpDate), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                  {m.publishedAt 
                    ? <>Published {format(new Date(m.publishedAt), 'MMM d, yyyy')}</> 
                    : <>Created {format(new Date(m.createdAt), 'MMM d, yyyy')}</>}
                </span>
                {m.status === ContinuousStatus.DRAFT && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-black rounded uppercase tracking-widest border border-amber-200 flex items-center gap-1">
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    Draft
                  </span>
                )}
                {m.managerId === user?.id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(m)} style={{ padding: 6, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', borderRadius: 8 }} className="hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                      <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setMeetingToDelete(m.meetingId)} style={{ padding: 6, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', borderRadius: 8 }} className="hover:bg-rose-50 hover:text-rose-600 transition-colors">
                      <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/50">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Discussion Points</span>
                <p 
                  onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                  style={{ cursor: 'pointer' }}
                  className="text-slate-700 text-sm leading-relaxed whitespace-pre-line hover:text-indigo-600 transition-colors"
                >
                  {m.discussionPoints}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Key Issues</span>
                <p 
                  onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                  style={{ cursor: 'pointer' }}
                  className="text-slate-700 text-sm leading-relaxed whitespace-pre-line hover:text-indigo-600 transition-colors"
                >
                  {m.keyIssues}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Action Items</span>
                <div className="space-y-2.5 mt-2">
                  {m.actionItems.map((item: any) => {
                    const isDone = item.status === ActionItemStatus.DONE;
                    const isEmployee = user?.id === m.employeeId;
                    return (
                      <div key={item.id} className="flex items-start gap-3 group/item">
                        <div className="pt-0.5 relative group/tooltip">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={async () => {
                              if (!isEmployee || isDone) return;
                              try {
                                await updateActionItemStatus({
                                  meetingId: m.meetingId,
                                  itemId: item.id,
                                  status: ActionItemStatus.DONE
                                }).unwrap();
                              } catch (err) {
                                console.error("Failed to update status", err);
                              }
                            }}
                            disabled={!isEmployee || isDone}
                            className={`w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all ${(!isEmployee || isDone) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'}`}
                          />
                          {(!isEmployee || isDone) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                              {isDone ? 'Completed items cannot be unchecked' : 'This status is managed by the employee'}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Item content with status-based styling */}
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className={`text-sm leading-relaxed transition-all duration-300 ${isDone ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}>
                              {item.content}
                            </p>
                            {item.assignedToName && (
                              <span className="office-tag-badge" style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', fontSize: 9, padding: '1px 6px' }}>
                                {item.assignedToName}
                              </span>
                            )}
                            {item.dueDate && (
                              <span className="office-tag-badge" style={{ fontSize: 9 }}>
                                due {format(new Date(item.dueDate), 'dd/MM/yyyy')}
                              </span>
                            )}

                            {/* Re-opened badge: shown when PENDING but has a reopenReason */}
                            {!isDone && item.reopenReason && (
                              <div className="relative group/reopen flex-shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full cursor-default">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Re-opened
                                </span>
                                {/* Tooltip showing the reopen reason */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 group-hover/reopen:opacity-100 transition-all duration-200 pointer-events-none z-20 p-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Re-open Reason</p>
                                  <p className="text-xs leading-relaxed text-slate-200 font-normal">"{item.reopenReason}"</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Completed status row */}
                          {isDone && (
                            <div className="mt-1 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="inline-flex items-center text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                  <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  Completed
                                </span>
                                {item.completedAt && (
                                  <span className="text-[11px] text-slate-400 ml-2 font-light">
                                    {format(new Date(item.completedAt), "MMM d, h:mm a")}
                                  </span>
                                )}
                              </div>
                              {m.managerId === user?.id && (
                                <button
                                  onClick={() => setReopenConfig({ meetingId: m.meetingId, item })}
                                  className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition opacity-0 group-hover/item:opacity-100 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg"
                                >
                                  Re-open
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {m.actionItems.length === 0 && (
                    <p className="text-slate-400 text-xs italic">No action items defined.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span>Replies {(m.commentCount || 0) > 0 ? `(${m.commentCount})` : ''}</span>
              </button>
              {m.status === ContinuousStatus.DRAFT && m.managerId === user?.id && (
                <button 
                  onClick={() => handlePublish(m.meetingId)}
                  disabled={isPublishing}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Meeting
                </button>
              )}
            </div>

            {expandedMeetingId === m.meetingId && (
              <MeetingComments meetingId={m.meetingId} isManager={m.managerId === user?.id} />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '14px 0', borderTop: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              style={{ ...btnPageStyle(false), opacity: currentPage === 1 ? 0.3 : 1 }}
              className="office-button-secondary !p-0 flex items-center justify-center">
              <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (totalPages > 5 && p !== 1 && p !== totalPages && (p < currentPage - 1 || p > currentPage + 1)) {
                if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} style={{ fontSize: 11, color: '#64748B', padding: '0 4px' }}>…</span>;
                return null;
              }
              const isActive = currentPage === p;
              return (
                <button 
                  key={p} 
                  onClick={() => handlePageChange(p)} 
                  style={btnPageStyle(isActive)}
                  className={isActive ? 'office-button-primary !p-0' : 'office-button-secondary !p-0'}
                >
                  {p}
                </button>
              );
            })}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
              style={{ ...btnPageStyle(false), opacity: currentPage === totalPages || totalPages === 0 ? 0.3 : 1 }}
              className="office-button-secondary !p-0 flex items-center justify-center">
              <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Go to</label>
            <input type="text" value={goToPage} onChange={(e) => setGoToPage(e.target.value)} placeholder="…"
              className="office-input" style={{ width: 48, padding: '4px 8px', fontSize: 11, textAlign: 'center' }} />
          </form>
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="office-panel animate-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 540, overflow: 'hidden', padding: 0 }}>
            <div style={{ background: '#4F46E5', padding: '20px 24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>{editingId ? 'Update Meeting Details' : 'Schedule 1-on-1 Conversation'}</h2>
              <p style={{ fontSize: 12, color: '#E0E7FF', marginTop: 4 }}>Define discussion items, action steps, and schedule.</p>
            </div>
            <div style={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meeting Title</label>
                    <span className="text-[10px] text-slate-400 font-semibold">{newMeeting.meetingTitle.length} / 255</span>
                  </div>
                  <input type="text" className="office-input" placeholder="e.g. Sprint Review 1:1"
                    maxLength={255}
                    value={newMeeting.meetingTitle}
                    onChange={e => setNewMeeting({ ...newMeeting, meetingTitle: e.target.value })}
                    autoFocus={!!editingId}
                    onFocus={editingId ? (e) => {
                      const val = e.target.value;
                      e.target.value = '';
                      e.target.value = val;
                    } : undefined} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Employee</label>
                    {editingId && editingEmployee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 14px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}>
                          {editingEmployee.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{editingEmployee.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#E2E8F0', borderRadius: 6, padding: '2px 6px' }}>Fixed</span>
                      </div>
                    ) : (
                      <select required className="office-input" value={newMeeting.employeeId || ""}
                        onChange={e => setNewMeeting({ ...newMeeting, employeeId: Number(e.target.value) })}>
                        <option value="">Choose Member…</option>
                        {filteredEmployees?.map(emp => <option key={emp.id} value={emp.id}>{emp.staffName}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date &amp; Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input required type="date" min={todayStr} className="office-input" value={newMeeting.meetingDate}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })} />
                      <input required type="time" className="office-input" value={newMeeting.meetingTime}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingTime: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discussion Points</label>
                    <span className="text-[10px] text-slate-400 font-semibold">{newMeeting.discussionPoints.length} / 4000</span>
                  </div>
                  <textarea required className="office-input" style={{ height: 68, resize: 'none' }}
                    placeholder="What topics will be addressed?" value={newMeeting.discussionPoints}
                    maxLength={4000}
                    onChange={e => setNewMeeting({ ...newMeeting, discussionPoints: e.target.value })}
                    onFocus={editingId ? (e) => {
                      const val = e.target.value;
                      e.target.value = '';
                      e.target.value = val;
                    } : undefined} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Issues</label>
                      <span className="text-[10px] text-slate-400 font-semibold">{newMeeting.keyIssues.length} / 4000</span>
                    </div>
                    <textarea required className="office-input" style={{ height: 120, resize: 'none' }}
                      placeholder="Any concerns, challenges, or risks..."
                      maxLength={4000}
                      value={newMeeting.keyIssues} onChange={e => setNewMeeting({ ...newMeeting, keyIssues: e.target.value })}
                      onFocus={editingId ? (e) => {
                        const val = e.target.value;
                        e.target.value = '';
                        e.target.value = val;
                      } : undefined} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Action Items</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {newMeeting.actionItems.map((item, index) => {
                        const isDone = item.status === ActionItemStatus.DONE;
                        return (
                          <div key={index} className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  disabled={isDone}
                                  className={`w-full pl-2.5 pr-14 py-1.5 rounded-lg text-sm transition border-none bg-white ${isDone ? 'text-slate-400 cursor-not-allowed italic' : 'focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium'}`}
                                  placeholder="Task description…"
                                  maxLength={255}
                                  value={item.content}
                                  onChange={e => {
                                    const updated = [...newMeeting.actionItems];
                                    updated[index] = { ...item, content: e.target.value };
                                    setNewMeeting({ ...newMeeting, actionItems: updated });
                                  }}
                                  onFocus={editingId ? (e) => {
                                    const val = e.target.value;
                                    e.target.value = '';
                                    e.target.value = val;
                                  } : undefined}
                                />
                                {!isDone && item.content.length > 0 && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-semibold bg-white/90 px-1 select-none pointer-events-none">
                                    {item.content.length}/255
                                  </span>
                                )}
                                {isDone && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Locked</span>}
                              </div>
                              {!isDone && (
                                <button type="button" onClick={() => setNewMeeting({ ...newMeeting, actionItems: newMeeting.actionItems.filter((_, i) => i !== index) })}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              )}
                            </div>
                            {!isDone && (
                              <div className="flex gap-2 pl-0">
                                <input type="date"
                                  min={newMeeting.meetingDate || undefined}
                                  max={newMeeting.followUpDate || undefined}
                                  className="office-input !py-1 !px-2"
                                  style={{ fontSize: 11, flex: 1 }}
                                  value={item.dueDate ?? ''}
                                  onChange={e => {
                                    const updated = [...newMeeting.actionItems];
                                    updated[index] = { ...item, dueDate: e.target.value || undefined };
                                    setNewMeeting({ ...newMeeting, actionItems: updated });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button type="button"
                        onClick={() => setNewMeeting({ ...newMeeting, actionItems: [...newMeeting.actionItems, { content: "", status: ActionItemStatus.PENDING }] })}
                        className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition flex items-center justify-center gap-2 mt-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Follow Up Date</label>
                  <input type="date" min={newMeeting.meetingDate} className="office-input" value={newMeeting.followUpDate}
                    onChange={e => setNewMeeting({ ...newMeeting, followUpDate: e.target.value })} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setEditingEmployee(null);
                      setNewMeeting({
                        employeeId: 0,
                        meetingTitle: "",
                        meetingDate: "",
                        meetingTime: "",
                        discussionPoints: "",
                        keyIssues: "",
                        actionItems: [],
                        followUpDate: ""
                      });
                    }}
                    className="office-button-secondary"
                  >
                    Cancel
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={(e) => handleSchedule(e as any)}
                      disabled={isUpdating}
                      className="office-button-primary"
                    >
                      {isUpdating ? "Updating..." : "Update Meeting"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleSchedule(e as any, ContinuousStatus.DRAFT)}
                        disabled={isScheduling}
                        className="office-button-secondary"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSchedule(e as any, ContinuousStatus.PUBLISHED)}
                        disabled={isScheduling}
                        className="office-button-primary"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Publish Meeting
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Modal */}
      {meetingToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="office-panel animate-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 380, padding: 24, textAlign: 'center', margin: 'auto' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #FEE2E2' }}>
              <svg style={{ width: 22, height: 22, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.2px' }}>Delete Meeting Record?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: '1.5' }}>This action is permanent and cannot be undone. All related points and replies will be deleted.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setMeetingToDelete(null)} className="office-button-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="office-button-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {reopenConfig && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="office-panel w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden" style={{ padding: 0 }}>
            <div style={{ background: '#4F46E5', padding: '20px 24px', textAlign: 'center' }} className="text-white">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">Re-open Action Item</h3>
              <p className="text-slate-300 text-xs font-medium mt-1">Please provide a reason for re-opening this task.</p>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Task Content</span>
                <p className="text-sm text-slate-700 font-medium italic">"{reopenConfig.item.content}"</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Reason for Re-opening</label>
                <textarea 
                  autoFocus
                  required
                  className="office-input !bg-slate-50"
                  style={{ height: 96, resize: 'none' }}
                  placeholder="Explain why this task needs further attention..."
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setReopenConfig(null);
                    setReopenReason("");
                  }}
                  className="office-button-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  disabled={!reopenReason.trim()}
                  onClick={async () => {
                    try {
                      await reopenActionItem({
                        meetingId: reopenConfig.meetingId,
                        itemId: reopenConfig.item.id,
                        reason: reopenReason
                      }).unwrap();
                      setReopenConfig(null);
                      setReopenReason("");
                    } catch (err) {
                      console.error("Failed to re-open item", err);
                    }
                  }}
                  className="office-button-primary"
                  style={{ flex: 1 }}
                >
                  Re-open Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MeetingComments = ({ meetingId, isManager }: { meetingId: number; isManager: boolean }) => {
  const { user, isAdmin, isHR } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; comment: any } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, comment: any) => {
    e.preventDefault();
    const container = e.currentTarget.closest('.space-y-4');
    if (container) {
      const rect = container.getBoundingClientRect();
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, comment });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, comment });
    }
  };

  const { data: comments, isLoading } = useGetMeetingCommentsQuery(meetingId);
  const [addComment, { isLoading: isCommenting }] = useAddMeetingCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation();

  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: number; name: string; text: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleScrollToParent = (parentId: number) => {
    const element = document.getElementById(`comment-${parentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCommentId(parentId);
      setTimeout(() => setHighlightedCommentId(null), 2000);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      await addComment({
        meetingId,
        body: { comment: newComment, commentType: isManager ? 'MANAGER' : 'EMPLOYEE', managerId: isManager ? user.id : undefined, employeeId: !isManager ? user.id : undefined, parentId: replyingToId ?? undefined }
      }).unwrap();
      setNewComment("");
      setReplyingToId(null);
      setReplyTarget(null);
    } catch (err) { console.error("Failed to add comment", err); }
  };

  const startReply = (comment: any) => {
    const name = comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName;
    setReplyingToId(comment.id);
    setReplyTarget({ id: comment.id, name, text: comment.comment });
    setTimeout(() => {
      if (mainInputRef.current) {
        mainInputRef.current.focus({ preventScroll: true });
        mainInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editCommentText.trim() || !user) return;
    try {
      await updateComment({ commentId, meetingId, body: { comment: editCommentText, commentType: isManager ? 'MANAGER' : 'EMPLOYEE', managerId: isManager ? user.id : undefined, employeeId: !isManager ? user.id : undefined } }).unwrap();
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) { console.error("Failed to update comment", err); }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment({ commentId: commentToDelete, meetingId }).unwrap();
      setCommentToDelete(null);
    } catch (err) { console.error("Failed to delete comment", err); }
  };

  if (isLoading) return <div style={{ marginTop: 16, fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' }}>Fetching discussions…</div>;

  const sortedComments = [...(comments || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F1F5F9', position: 'relative' }} className="space-y-4">
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment, index) => {
            const currentDate = comment.createdAt ? format(new Date(comment.createdAt), 'yyyy-MM-dd') : '';
            const prevDate = index > 0 && sortedComments[index - 1].createdAt ? format(new Date(sortedComments[index - 1].createdAt), 'yyyy-MM-dd') : '';
            const isNewDay = currentDate !== prevDate;
            return (
              <React.Fragment key={comment.id}>
                {isNewDay && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                    <span className="px-3 py-1 bg-slate-100 border border-slate-200/60 rounded-full text-[10px] font-bold text-slate-500">
                      {format(new Date(comment.createdAt), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
                <CommentItem comment={comment} allComments={sortedComments} user={user} isManager={isManager}
                  highlightedCommentId={highlightedCommentId} editingCommentId={editingCommentId}
                  editCommentText={editCommentText} setEditCommentText={setEditCommentText}
                  setEditingCommentId={setEditingCommentId} handleUpdateComment={handleUpdateComment}
                  handleScrollToParent={handleScrollToParent} onContextMenu={handleContextMenu}
                  isUpdatingComment={isUpdatingComment} />
              </React.Fragment>
            );
          })
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 16 }}>
            <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>No conversation yet. Be the first to share your thoughts.</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ position: 'absolute', zIndex: 1000, width: 176, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '6px 0', top: contextMenu.y, left: contextMenu.x }}
          className="shadow-xl"
          onClick={(e) => e.stopPropagation()}>
          {[
            { label: 'Reply', onClick: () => { startReply(contextMenu.comment); setContextMenu(null); }, color: '#0F172A', iconPath: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', iconColor: '#4F46E5' },
            { label: 'Copy Text', onClick: () => { navigator.clipboard.writeText(contextMenu.comment.comment); setContextMenu(null); }, color: '#0F172A', iconPath: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3', iconColor: '#64748B' },
          ].map(item => (
            <button key={item.label} onClick={item.onClick}
              style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: item.color, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              className="hover:bg-slate-50 transition-colors">
              <svg style={{ width: 14, height: 14, color: item.iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} /></svg>
              {item.label}
            </button>
          ))}
          {((isManager && contextMenu.comment.commentType === 'MANAGER' && contextMenu.comment.managerId === user?.id) ||
            (!isManager && contextMenu.comment.commentType === 'EMPLOYEE' && contextMenu.comment.employeeId === user?.id) ||
            isAdmin || isHR) && (
            <>
              <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
              <button onClick={() => { setEditingCommentId(contextMenu.comment.id); setEditCommentText(contextMenu.comment.comment); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#0F172A', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-slate-50 transition-colors">
                <svg style={{ width: 14, height: 14, color: '#4F46E5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button onClick={() => { setCommentToDelete(contextMenu.comment.id); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-rose-50 transition-colors">
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
        {replyTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, background: '#EEF2FF', border: '1px solid #C7D2FE', borderLeft: '3px solid #4F46E5', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{replyTarget.name}</p>
              <p style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }} className="truncate">{replyTarget.text}</p>
            </div>
            <button onClick={() => { setReplyingToId(null); setReplyTarget(null); }}
              className="hover:bg-slate-200 transition-colors"
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#E2E8F0', color: '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 10, height: 10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="office-avatar-circle bg-indigo-50 text-indigo-600 border border-indigo-100" style={{ width: 28, height: 28, borderRadius: 8, fontSize: 11 }}>
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: 24, padding: '3px 6px 3px 14px', alignItems: 'center', border: '1px solid #E2E8F0' }}>
            <input
              ref={mainInputRef}
              style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13, height: 32, padding: 0 }}
              placeholder={replyTarget ? `Replying to ${replyTarget.name}...` : "Add to the conversation..."}
              maxLength={2000}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              style={{ background: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isCommenting || !newComment.trim() ? 'not-allowed' : 'pointer', opacity: isCommenting || !newComment.trim() ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Comment Modal */}
      {commentToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="office-panel animate-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 360, padding: 24, textAlign: 'center', margin: 'auto' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #FEE2E2' }}>
              <svg style={{ width: 22, height: 22, color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 8, letterSpacing: '-0.2px' }}>Delete Comment?</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: '1.5' }}>This reply and any sub-threads will be deleted permanently.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setCommentToDelete(null)} className="office-button-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDeleteComment} className="office-button-danger" style={{ flex: 1 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage;