import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';
import { useAuth } from "../../hooks/useAuth";
import {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useCreateFeedbackTagMutation,
  useUpdateFeedbackTagMutation,
  useDeleteFeedbackTagMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useDeleteReplyMutation,
  useUpdateReplyMutation,
  usePublishFeedbackMutation,
  useGetFeedbackStatsForManagerQuery,
  useGetFeedbacksByEmployeeQuery,
  useGetFeedbacksByManagerQuery,
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { FeedbackType, ContinuousStatus } from "../../features/continuous/continuousTypes";
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

const FEEDBACK_TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  [FeedbackType.PRAISE]:      { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'POSITIVE':                 { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'REWARDS':                  { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  [FeedbackType.IMPROVEMENT]: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'CONSTRUCTIVE':             { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'COACHING':                 { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'OBSERVATION':              { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'PROGRESS':                 { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'SATISFACTORY':             { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  'SUGGESTION':               { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  [FeedbackType.WARNING]:     { bg: '#FFF5F5', text: '#B91C1C', border: '#FECACA' },
  'NEGATIVE':                 { bg: '#FFF5F5', text: '#B91C1C', border: '#FECACA' },
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
    border-color: rgba(99, 102, 241, 0.2);
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
  .office-timeline-line {
    position: relative;
  }
  .office-timeline-line::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 27px;
    width: 2px;
    background: #E2E8F0;
    z-index: 0;
  }
  .office-feed-card {
    position: relative;
    z-index: 1;
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
  .office-snapshot-bar {
    height: 8px;
    background: #F1F5F9;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid #E2E8F0;
  }
  .office-snapshot-fill {
    height: 100%;
    border-radius: 999px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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

const FeedbackSnapshot = ({ stats }: { stats: { praise: number; improvement: number; correction: number } }) => {
  const { isManager, isAdmin, isHR } = useAuth();
  const showTips = isManager || isAdmin || isHR;

  const bars = [
    { label: 'Praise', val: stats.praise, bar: '#10B981', text: '#059669' },
    { label: 'Improvement', val: stats.improvement, bar: '#F59E0B', text: '#D97706' },
    { label: 'Correction', val: stats.correction, bar: '#EF4444', text: '#DC2626' },
  ];

  return (
    <div style={panelStyle} className="space-y-4">
      <p style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback Snapshot</p>
      <div className="space-y-3">
        {bars.map(b => (
          <div key={b.label} className="space-y-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{b.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.text }}>{b.val}%</span>
            </div>
            <div className="office-snapshot-bar">
              <div className="office-snapshot-fill" style={{ background: b.bar, width: `${b.val}%` }} />
            </div>
          </div>
        ))}
      </div>

      {showTips && (
        <div style={{ background: '#4F46E5', borderRadius: 16, padding: '16px', marginTop: 4 }} className="space-y-3 shadow-xl shadow-indigo-200">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg style={{ width: 16, height: 16, color: '#E0E7FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Manager Tips</span>
          </div>
          <p style={{ fontSize: 12, color: '#C7D2FE', lineHeight: 1.6 }}>Giving constructive feedback works best when it's specific, actionable, and delivered within 24 hours.</p>
          <div className="space-y-2">
            {['Use the "Situation-Behavior-Impact" model.', 'Balance praise with growth opportunities.'].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 12px' }}>
                <svg style={{ width: 12, height: 12, color: '#A5B4FC', flexShrink: 0, marginTop: 2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <p style={{ fontSize: 11, color: '#E0E7FF', lineHeight: 1.4 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const feedbackTypeConfig = {
  [FeedbackType.PRAISE]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    label: 'Praise',
    activeStyle: { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#64748B' } as React.CSSProperties,
  },
  [FeedbackType.IMPROVEMENT]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    label: 'Improvement',
    activeStyle: { background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#64748B' } as React.CSSProperties,
  },
  [FeedbackType.WARNING]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    label: 'Correction',
    activeStyle: { background: '#FFF5F5', color: '#B91C1C', border: '1px solid #FECACA' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#64748B' } as React.CSSProperties,
  },
};

const ReplyItem = ({
  reply, allReplies, user, authorId, highlightedReplyId,
  editingReplyId, editReplyText, setEditReplyText, setEditingReplyId,
  handleUpdateReply, handleScrollToParent, onContextMenu, isUpdatingReply
}: {
  reply: any; allReplies: any[]; user: any; authorId: number | string;
  highlightedReplyId: number | string | null; editingReplyId: number | string | null;
  editReplyText: string; setEditReplyText: (val: string) => void;
  setEditingReplyId: (val: number | string | null) => void;
  handleUpdateReply: (id: any) => void;
  handleScrollToParent: (parentId: any) => void;
  onContextMenu: (e: React.MouseEvent, reply: any) => void;
  isUpdatingReply: boolean;
}) => {
  const isCurrentUser = String(reply.employeeId) === String(user?.id);
  const isAuthor = String(reply.employeeId) === String(authorId);
  const isHighlighted = String(highlightedReplyId) === String(reply.replyId);

  const bubbleStyle: React.CSSProperties = isCurrentUser
    ? { background: '#6366F1', color: '#FFFFFF', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', minWidth: 120, position: 'relative', boxShadow: '0 2px 8px rgba(99,102,241,0.08)' }
    : { background: '#F1F5F9', color: '#1E293B', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', minWidth: 120, position: 'relative', boxShadow: '0 2px 8px rgba(148,163,184,0.04)', border: '1px solid #E2E8F0' };

  const avatarBg = isCurrentUser || isHighlighted ? '#6366F1' : '#E2E8F0';
  const avatarText = isCurrentUser || isHighlighted ? '#FFFFFF' : '#475569';

  return (
    <div id={`reply-${reply.replyId}`} onContextMenu={(e) => onContextMenu(e, reply)}
      style={isHighlighted ? { background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 16, padding: 12, margin: -12, transition: 'all 0.3s' } : { transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', gap: 10, ...(isCurrentUser ? { flexDirection: 'row-reverse' as const } : {}) }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: avatarBg, color: avatarText, border: isCurrentUser || isHighlighted ? 'none' : '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          {reply.employeeName?.charAt(0) || '?'}
        </div>
        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1E293B', letterSpacing: '0.1px' }}>
              {isCurrentUser ? 'You' : reply.employeeName}
            </span>
            {isAuthor && <span style={{ background: '#4F46E5', color: '#FFFFFF', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Author</span>}
            <span style={{ fontSize: 9, color: '#94A3B8' }}>{reply.createdAt ? format(new Date(reply.createdAt), 'h:mm a') : ''}</span>
          </div>
          <div style={bubbleStyle} className="group">
            <button onClick={(e) => onContextMenu(e as any, reply)}
              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', color: isCurrentUser ? '#C7D2FE' : '#94A3B8', cursor: 'pointer', padding: 2, display: 'flex' }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {reply.parentId && (() => {
              const parent = allReplies?.find(r => String(r.replyId) === String(reply.parentId));
              if (!parent) return null;
              return (
                <div onClick={() => handleScrollToParent(parent.replyId)}
                  style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 10, borderLeft: '3px solid #6366F1', background: isCurrentUser ? 'rgba(255,255,255,0.15)' : '#F1F5F9', cursor: 'pointer' }}
                  className="hover:opacity-90 transition-opacity">
                  <div style={{ fontSize: 9, fontWeight: 700, color: isCurrentUser ? '#FFFFFF' : '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{parent.employeeName}</div>
                  <div style={{ fontSize: 10, color: isCurrentUser ? '#CBD5E1' : '#475569', fontStyle: 'italic' }} className="line-clamp-2">"{parent.replyText}"</div>
                </div>
              );
            })()}

            {editingReplyId === reply.replyId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input className="office-input" style={{ padding: '6px 10px', minWidth: 150 }}
                  maxLength={2000}
                  value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} autoFocus
                  onFocus={(e) => {
                    const val = e.target.value;
                    e.target.value = '';
                    e.target.value = val;
                  }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingReplyId(null)} style={{ fontSize: 10, fontWeight: 600, color: isCurrentUser ? '#CBD5E1' : '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={isUpdatingReply} onClick={() => handleUpdateReply(reply.replyId)}
                    style={{ fontSize: 10, fontWeight: 700, color: isCurrentUser ? '#FFFFFF' : '#6366F1', background: 'none', border: 'none', cursor: isUpdatingReply ? 'not-allowed' : 'pointer', opacity: isUpdatingReply ? 0.5 : 1 }}>
                    {isUpdatingReply ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 13, color: isCurrentUser ? '#FFFFFF' : '#0F172A', lineHeight: 1.5, display: 'block', paddingRight: 10 }}>{reply.replyText}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 8, fontWeight: 600, color: isCurrentUser ? '#C7D2FE' : '#94A3B8' }}>{formatRelativeTime(reply.createdAt)}</span>
                  {isCurrentUser && <svg style={{ width: 10, height: 10, color: '#FFFFFF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackPage = () => {
  const { user, isManager, isAdmin, isHR, isIntern, hasPermission } = useAuth();
  const canViewFeedback = isAdmin || hasPermission('FEEDBACK_VIEW') || isManager || isHR || isIntern;
  const canCreate = isManager || isAdmin || isHR || hasPermission('FEEDBACK_GIVE');

  const [perspective, setPerspective] = useState<'all' | 'received' | 'given'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterFeedbackType, setFilterFeedbackType] = useState<string | undefined>(undefined);
  const [filterTagId, setFilterTagId] = useState<number | undefined>(undefined);
  const [filterCreatedAfter, setFilterCreatedAfter] = useState<string>('');
  const [filterCreatedBefore, setFilterCreatedBefore] = useState<string>('');

  const queryParams = {
    page: currentPage - 1,
    size: itemsPerPage,
    feedbackType: filterFeedbackType,
    tagId: filterTagId,
    createdAfter: filterCreatedAfter || undefined,
    createdBefore: filterCreatedBefore || undefined
  };

  const { data: allResponse, isLoading: isLoadingAll } = useGetAllFeedbacksQuery(
    { ...queryParams, status: filterStatus },
    { skip: !user || perspective !== 'all' }
  );

  const { data: employeeResponse, isLoading: isLoadingEmp } = useGetFeedbacksByEmployeeQuery(
    { employeeId: user?.id || 0, ...queryParams },
    { skip: !user || perspective !== 'received' }
  );

  const { data: managerResponse, isLoading: isLoadingMgr } = useGetFeedbacksByManagerQuery(
    { managerId: user?.id || 0, status: filterStatus, ...queryParams },
    { skip: !user || perspective !== 'given' }
  );

  const feedbackResponse = perspective === 'all' ? allResponse : perspective === 'received' ? employeeResponse : managerResponse;
  const isLoading = perspective === 'all' ? isLoadingAll : perspective === 'received' ? isLoadingEmp : isLoadingMgr;

  const feedbacks = feedbackResponse?.content || [];
  const { data: tags } = useGetFeedbackTagsQuery();
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];

  const [createFeedback, { isLoading: isCreating }] = useCreateFeedbackMutation();
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();
  const [deleteFeedback] = useDeleteFeedbackMutation();
  const [publishFeedback, { isLoading: isPublishing }] = usePublishFeedbackMutation();
  const { data: feedbackStats } = useGetFeedbackStatsForManagerQuery(user?.id || 0, { skip: !user?.id });
  const [createFeedbackTag, { isLoading: isCreatingTag }] = useCreateFeedbackTagMutation();
  const [updateFeedbackTag, { isLoading: isUpdatingTag }] = useUpdateFeedbackTagMutation();
  const [deleteFeedbackTag] = useDeleteFeedbackTagMutation();

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<{ id: number | string; name: string } | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | string | null>(null);

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

  const blankFeedback = { employeeId: "" as number | string, tagId: "" as number | "", feedbackType: FeedbackType.PRAISE, description: "" };
  const [showModal, setShowModal] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<ContinuousStatus>(ContinuousStatus.PUBLISHED);
  const [newFeedback, setNewFeedback] = useState<{
    employeeId: number | string;
    tagId: number | "";
    feedbackType: FeedbackType;
    description: string;
  }>({
    employeeId: "",
    tagId: "",
    feedbackType: FeedbackType.PRAISE,
    description: "",
  });

  const selectedEmp = employees?.find(e => String(e.id) === String(newFeedback.employeeId) || String((e as any).userId) === String(newFeedback.employeeId));

  const handleCreate = async (e: React.FormEvent, status?: ContinuousStatus) => {
    if (e) e.preventDefault();
    if (!user || !newFeedback.employeeId || !newFeedback.tagId) {
      toast.warning("Please select an employee and a category.");
      return;
    }
    try {
      const resolvedStatus = status || (editingId ? undefined : submitStatus);
      const body = {
        employeeId: newFeedback.employeeId,
        tagId: Number(newFeedback.tagId),
        feedbackType: newFeedback.feedbackType,
        description: newFeedback.description,
        managerId: user.id,
        status: resolvedStatus,
      };

      if (editingId) {
        await updateFeedback({ id: editingId, body }).unwrap();
      } else {
        await createFeedback(body).unwrap();
      }

      setShowModal(false);
      setEditingId(null);
      setEditingEmployee(null);
      setNewFeedback({ employeeId: "", tagId: "", feedbackType: FeedbackType.PRAISE, description: "" });
    } catch (err: any) {
      toast.error("Failed to save feedback.");
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      if (editingTagId) {
        await updateFeedbackTag({ id: editingTagId, body: { tagName: newTagName } }).unwrap();
      } else {
        const response = await createFeedbackTag({ tagName: newTagName }).unwrap();
        setNewFeedback({ ...newFeedback, tagId: response.tagId });
      }
      setIsAddingTag(false); setEditingTagId(null); setNewTagName("");
    } catch (err: any) { toast.error("Failed to save tag."); }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      await deleteFeedbackTag(tagToDelete).unwrap();
      if (newFeedback.tagId === tagToDelete) setNewFeedback({ ...newFeedback, tagId: "" });
      setTagToDelete(null);
    } catch (err: any) { toast.error("Failed to delete tag."); }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    try {
      await deleteFeedback(feedbackToDelete).unwrap();
      setFeedbackToDelete(null);
    } catch (err: any) { toast.error("Failed to delete feedback."); }
  };

  const handleEdit = (fb: any) => {
    setEditingId(fb.feedbackId);
    const emp = employees?.find(e => String(e.id) === String(fb.employeeId) || String((e as any).userId) === String(fb.employeeId));
    setEditingEmployee({ id: fb.employeeId, name: emp?.staffName || fb.employeeName || 'Unknown' });
    setNewFeedback({
      employeeId: fb.employeeId,
      tagId: fb.tag?.tagId || 0,
      feedbackType: fb.feedbackType,
      description: fb.description,
    });
    setShowModal(true);
  };

  const handlePublish = async (id: number | string) => {
    try {
      await publishFeedback(id).unwrap();
      toast.success('Feedback published successfully!');
    } catch (err: any) {
      toast.error('Failed to publish feedback.');
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) { setCurrentPage(page); setGoToPage(""); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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

  const totalItems = feedbackResponse?.totalElements || 0;
  const totalPages = feedbackResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + feedbacks.length;

  const publishedFeedbacks = feedbacks?.filter(f => f.status === ContinuousStatus.PUBLISHED) || [];
  const praiseList = [FeedbackType.PRAISE, 'POSITIVE', 'REWARDS'];
  const imprList = [FeedbackType.IMPROVEMENT, 'CONSTRUCTIVE', 'COACHING', 'OBSERVATION', 'PROGRESS', 'SATISFACTORY', 'SUGGESTION'];
  const warnList = [FeedbackType.WARNING, 'NEGATIVE'];

  const stats = (feedbackStats && (feedbackStats.totalPublished || 0) > 0 && perspective === 'all' && !filterFeedbackType && !filterTagId && !filterCreatedAfter && !filterCreatedBefore) ? {
    praise: Math.round(((feedbackStats.praise || 0) / feedbackStats.totalPublished) * 100),
    improvement: Math.round(((feedbackStats.improvement || 0) / feedbackStats.totalPublished) * 100),
    correction: Math.round(((feedbackStats.warning || 0) / feedbackStats.totalPublished) * 100),
  } : {
    praise: Math.round((publishedFeedbacks.filter(f => praiseList.includes(f.feedbackType)).length / (publishedFeedbacks.length || 1)) * 100),
    improvement: Math.round((publishedFeedbacks.filter(f => imprList.includes(f.feedbackType)).length / (publishedFeedbacks.length || 1)) * 100),
    correction: Math.round((publishedFeedbacks.filter(f => warnList.includes(f.feedbackType)).length / (publishedFeedbacks.length || 1)) * 100),
  };
  const btnPageStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
    background: active ? '#1A56DB' : 'transparent', color: active ? '#FFFFFF' : '#9EA3B0',
  });
  return (
    <div className="space-y-4 pb-8">
      <style dangerouslySetInnerHTML={{ __html: officeStyles }} />

      {/* Header */}
      <div className="office-panel" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px' }}>Continuous Feedback</h1>
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Real-time performance insights and team recognition.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)} className="office-button-primary">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Give Feedback
          </button>
        )}
      </div>

      {isManager && (
        <div className="space-y-3">
          {/* Perspective selector tabs */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1.5 flex gap-2 w-fit shadow-inner">
            <button
              type="button"
              onClick={() => { setPerspective('all'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'all'
                  ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              All Feedback
            </button>
            <button
              type="button"
              onClick={() => { setPerspective('received'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'received'
                  ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Feedback Received
            </button>
            <button
              type="button"
              onClick={() => { setPerspective('given'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'given'
                  ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Feedback Given
            </button>
          </div>

          {/* Draft/Published filter (only applicable for given or all) */}
          {perspective !== 'received' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {([{ label: 'All Statuses', value: undefined }, { label: 'Published Only', value: ContinuousStatus.PUBLISHED }, { label: 'Drafts Only', value: ContinuousStatus.DRAFT }] as const).map(({ label, value }) => (
                <button key={label} type="button"
                  onClick={() => { setFilterStatus(value as string | undefined); setCurrentPage(1); }}
                  className="office-pill-filter"
                  style={{ background: filterStatus === value ? '#4F46E5' : '#F1F5F9', color: filterStatus === value ? '#FFFFFF' : '#475569', border: filterStatus === value ? '1px solid #4F46E5' : '1px solid #E2E8F0' }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="office-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 130px', minWidth: 0 }}>
          <label style={labelStyle}>Type</label>
          <select className="office-input" value={filterFeedbackType ?? ''}
            onChange={e => { setFilterFeedbackType(e.target.value || undefined); setCurrentPage(1); }}>
            <option value="">All Types</option>
            <option value="PRAISE">Praise</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="WARNING">Warning</option>
          </select>
        </div>
        <div style={{ flex: '1 1 130px', minWidth: 0 }}>
          <label style={labelStyle}>Tag</label>
          <select className="office-input" value={filterTagId ?? ''}
            onChange={e => { setFilterTagId(e.target.value ? Number(e.target.value) : undefined); setCurrentPage(1); }}>
            <option value="">All Tags</option>
            {(tags || []).map(t => <option key={t.tagId} value={t.tagId}>{t.tagName}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 130px', minWidth: 0 }}>
          <label style={labelStyle}>From</label>
          <input type="date" className="office-input" value={filterCreatedAfter}
            onChange={e => { setFilterCreatedAfter(e.target.value); setCurrentPage(1); }} />
        </div>
        <div style={{ flex: '1 1 130px', minWidth: 0 }}>
          <label style={labelStyle}>To</label>
          <input type="date" className="office-input" value={filterCreatedBefore}
            onChange={e => { setFilterCreatedBefore(e.target.value); setCurrentPage(1); }} />
        </div>
        {(filterFeedbackType || filterTagId || filterCreatedAfter || filterCreatedBefore) && (
          <button type="button"
            onClick={() => { setFilterFeedbackType(undefined); setFilterTagId(undefined); setFilterCreatedAfter(''); setFilterCreatedBefore(''); setCurrentPage(1); }}
            className="office-button-secondary"
            style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1 office-timeline-line">
          {!canViewFeedback && (
            <div style={{ background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: 16, padding: '32px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#78350F', marginBottom: 6 }}>Access Restricted</h3>
              <p style={{ fontSize: 12, color: '#92400E', marginBottom: 14 }}>You are not authorized to view continuous feedback details.</p>
            </div>
          )}

          {canViewFeedback && feedbacks?.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 20 }}>
              <p style={{ fontSize: 13, color: '#64748B' }}>No feedback entries yet.</p>
            </div>
          )}

          {canViewFeedback && feedbacks?.map((fb) => {
            const typeStyle = FEEDBACK_TYPE_STYLE[fb.feedbackType] || FEEDBACK_TYPE_STYLE[FeedbackType.PRAISE];
            return (
              <div key={fb.feedbackId} className="office-feed-card group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: typeStyle.bg, color: typeStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, border: `1px solid ${typeStyle.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                      {fb.managerName.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {fb.managerName}
                        {String(fb.employeeId) !== String(user?.id) && <span style={{ color: '#64748B', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>to {fb.employeeName}</span>}
                        {String(fb.employeeId) === String(user?.id) && String(fb.managerId) === String(user?.id) && <span style={{ color: '#64748B', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>(Self)</span>}
                      </h3>
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>
                        {fb.publishedAt
                          ? <>Published {format(new Date(fb.publishedAt), 'dd/MM/yyyy, p')}</>
                          : format(new Date(fb.createdAt), 'dd/MM/yyyy, p')}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {fb.status === ContinuousStatus.DRAFT && (
                      <span style={{ fontSize: 9, fontWeight: 700, background: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 6, padding: '3px 8px' }}>
                        Draft
                      </span>
                    )}
                    <span style={{ fontSize: 9, fontWeight: 700, background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`, borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase' }}>
                      {fb.feedbackType}
                    </span>
                    {(String(fb.managerId) === String(user?.id) || String(fb.createdBy) === String(user?.id) || isAdmin || isHR) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <button onClick={() => handleEdit(fb)} style={{ padding: 5, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#EEF2FF] hover:text-[#6366F1] transition-colors">
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setFeedbackToDelete(fb.feedbackId)} style={{ padding: 5, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#FFF5F5] hover:text-[#B91C1C] transition-colors">
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {fb.tag && (
                  <span className="office-tag-badge" style={{ marginBottom: 8 }}>#{fb.tag.tagName}</span>
                )}
                <p 
                  onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb.feedbackId ? null : fb.feedbackId)}
                  style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, cursor: 'pointer' }}
                  className="hover:text-[#6366F1] transition-colors"
                >
                  {fb.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginTop: 12, borderTop: '1px solid #F1F5F9' }}>
                  <button type="button"
                    onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb.feedbackId ? null : fb.feedbackId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: expandedFeedbackId === fb.feedbackId ? '#6366F1' : '#94A3B8', fontSize: 12, fontWeight: 600 }}
                    className="hover:text-[#4F46E5] transition-colors">
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Replies{(fb.replyCount ?? 0) > 0 ? ` (${fb.replyCount})` : ''}
                  </button>
                  {fb.status === ContinuousStatus.DRAFT && (fb.managerId === user?.id || isAdmin || isHR) && (
                    <button type="button" onClick={() => handlePublish(fb.feedbackId)} disabled={isPublishing}
                      className="office-button-primary"
                      style={{ padding: '6px 12px', fontSize: 11 }}>
                      <svg style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Publish
                    </button>
                  )}
                </div>
                {expandedFeedbackId === fb.feedbackId && (
                  <FeedbackReplies feedbackId={fb.feedbackId} authorId={fb.managerId} />
                )}
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }} className="office-panel">
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Showing <strong style={{ color: '#0F172A' }}>{startIndex + 1}–{endIndex}</strong> of <strong style={{ color: '#0F172A' }}>{totalItems}</strong>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                  style={{ ...btnPageStyle(false), padding: '0 10px', border: '1px solid #E2E8F0', opacity: currentPage === 1 ? 0.4 : 1 }}>‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  return <button key={page} onClick={() => handlePageChange(page)} style={btnPageStyle(currentPage === page)}>{page}</button>;
                })}
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                  style={{ ...btnPageStyle(false), padding: '0 10px', border: '1px solid #E2E8F0', opacity: currentPage === totalPages ? 0.4 : 1 }}>›</button>
                <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  <label style={{ fontSize: 11, color: '#64748B' }}>Go to</label>
                  <input type="text" value={goToPage} onChange={(e) => setGoToPage(e.target.value)} placeholder="…"
                    className="office-input" style={{ width: 45, padding: '4px 8px', fontSize: 11 }} />
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-4 order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="office-panel" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #C7D2FE' }}>
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
                {perspective === 'received' ? 'Received Published' : perspective === 'given' ? 'Given Published' : 'Total Published'}
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                {perspective === 'received' ? (feedbackResponse?.totalElements || 0) : perspective === 'given' ? (feedbackResponse?.totalElements || 0) : (feedbackStats?.totalPublished || totalItems)}
              </p>
            </div>
          </div>
          {(isManager || isAdmin || isHR) && perspective !== 'received' && (
            <button type="button"
              onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
              className="office-panel hover:border-[#FDE68A] transition-colors"
              style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: '#FFFBEB', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #FDE68A' }}>
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Total Drafts</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: '#B45309' }}>{feedbackStats?.totalDraft || 0}</p>
              </div>
            </button>
          )}
          <FeedbackSnapshot stats={stats} />
        </div>
      </div>

      {/* Create/Edit Feedback Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, width: '100%', maxWidth: 520, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ background: '#4F46E5', padding: '16px 24px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>{editingId ? 'Edit Feedback' : 'Give Performance Feedback'}</h2>
            </div>
            <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Employee</label>
                    {editingId && editingEmployee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 14px' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}>
                          {editingEmployee.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{editingEmployee.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', background: '#E2E8F0', borderRadius: 6, padding: '2px 6px' }}>Fixed</span>
                      </div>
                    ) : (
                      <select required className="office-input" value={newFeedback.employeeId}
                        onChange={e => setNewFeedback({ ...newFeedback, employeeId: e.target.value })}>
                        <option value="">Choose Staff</option>
                        {filteredEmployees?.map(emp => <option key={emp.id} value={emp.id}>{emp.staffName}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Tag</label>
                      {!isAddingTag && (
                        <button type="button" onClick={() => setIsAddingTag(true)}
                          style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer' }}>+ New Tag</button>
                      )}
                    </div>
                    {isAddingTag ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <input type="text" autoFocus placeholder="New tag name…" className="office-input" style={{ width: '100%', paddingRight: 45 }}
                            maxLength={50}
                            value={newTagName} onChange={e => setNewTagName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } if (e.key === 'Escape') { setIsAddingTag(false); setNewTagName(""); } }} />
                          {newTagName.length > 0 && (
                            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 9, color: '#94A3B8', fontWeight: 600, pointerEvents: 'none' }}>
                              {newTagName.length}/50
                            </span>
                          )}
                        </div>
                        <button type="button" onClick={handleCreateTag} disabled={isCreatingTag || isUpdatingTag || !newTagName.trim()}
                          className="office-button-primary" style={{ padding: '7px 10px', minHeight: 38 }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button type="button" onClick={() => { setIsAddingTag(false); setNewTagName(""); }}
                          className="office-button-secondary" style={{ padding: '7px 10px', minHeight: 38 }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <select required className="office-input" value={newFeedback.tagId}
                        onChange={e => setNewFeedback({ ...newFeedback, tagId: Number(e.target.value) })}>
                        <option value="">Choose Tag…</option>
                        {tags?.map(tag => <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {selectedEmp && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 24 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Department</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selectedEmp.currentDepartmentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Position</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{selectedEmp.positionName}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Feedback Type</label>
                  <div style={{ display: 'flex', padding: 4, background: '#F1F5F9', borderRadius: 14, border: '1px solid #E2E8F0', gap: 4 }}>
                    {Object.values(FeedbackType).map(type => {
                      const config = feedbackTypeConfig[type];
                      const isActive = newFeedback.feedbackType === type;
                      return (
                        <button key={type} type="button" onClick={() => setNewFeedback({ ...newFeedback, feedbackType: type })}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)', ...(isActive ? config.activeStyle : config.inactiveStyle) }}>
                          {config.icon}{config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Description</label>
                    <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{newFeedback.description.length} / 4000</span>
                  </div>
                  <textarea required className="office-input" style={{ height: 110, resize: 'none', padding: '10px 14px' }}
                    placeholder="Provide specific details about the performance…"
                    maxLength={4000}
                    value={newFeedback.description} onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })}
                    autoFocus={!!editingId}
                    onFocus={editingId ? (e) => {
                      const val = e.target.value;
                      e.target.value = '';
                      e.target.value = val;
                    } : undefined} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                  <button type="button"
                    onClick={() => { setShowModal(false); setEditingId(null); setEditingEmployee(null); setNewFeedback({ employeeId: '', tagId: '', feedbackType: FeedbackType.PRAISE, description: '' }); }}
                    className="office-button-secondary">
                    Cancel
                  </button>
                  {editingId ? (
                    <button type="submit" disabled={isUpdating} className="office-button-primary">
                      {isUpdating ? 'Updating…' : 'Update Feedback'}
                    </button>
                  ) : (
                    <>
                      <button type="submit" onClick={() => setSubmitStatus(ContinuousStatus.DRAFT)} disabled={isCreating} className="office-button-secondary">
                        Save as Draft
                      </button>
                      <button type="submit" onClick={() => setSubmitStatus(ContinuousStatus.PUBLISHED)} disabled={isCreating} className="office-button-primary">
                        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        Publish Feedback
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tag Modal */}
      {tagToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, width: '100%', maxWidth: 350, padding: 24, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFF5F5', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg style={{ width: 22, height: 22, color: '#B91C1C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Delete Tag?</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Are you sure you want to delete <strong style={{ color: '#0F172A' }}>"{tags?.find(t => t.tagId === tagToDelete)?.tagName}"</strong>? This may affect historical data.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTagToDelete(null)} className="office-button-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDeleteTag} className="office-button-primary" style={{ flex: 1, background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.15)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Feedback Modal */}
      {feedbackToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, width: '100%', maxWidth: 350, padding: 24, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFF5F5', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg style={{ width: 22, height: 22, color: '#B91C1C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Delete Feedback?</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>This action cannot be undone. All replies associated with this feedback will also be removed.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFeedbackToDelete(null)} className="office-button-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDelete} className="office-button-primary" style={{ flex: 1, background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.15)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackReplies = ({ feedbackId, authorId }: { feedbackId: number | string; authorId: number | string }) => {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; reply: any } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, reply: any) => {
    e.preventDefault();
    const container = e.currentTarget.closest('.space-y-4');
    if (container) {
      const rect = container.getBoundingClientRect();
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, reply });
    } else {
      setContextMenu({ x: e.clientX, y: e.clientY, reply });
    }
  };

  const { data: replies, isLoading } = useGetFeedbackRepliesQuery(feedbackId as any);
  const [replyToFeedback, { isLoading: isReplying }] = useReplyToFeedbackMutation();
  const [deleteReply] = useDeleteReplyMutation();
  const [updateReply, { isLoading: isUpdatingReply }] = useUpdateReplyMutation();

  const [newReply, setNewReply] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: number | string; name: string; text: string } | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | string | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [replyToDelete, setReplyToDelete] = useState<number | string | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<number | string | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleScrollToParent = (parentId: number | string) => {
    const element = document.getElementById(`reply-${parentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedReplyId(parentId);
      setTimeout(() => setHighlightedReplyId(null), 2000);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !user) return;
    try {
      await replyToFeedback({ feedbackId: feedbackId as any, body: { replyText: newReply, employeeId: user.id as any, parentId: (replyingToId as any) ?? undefined } }).unwrap();
      setNewReply(""); setReplyingToId(null); setReplyTarget(null);
    } catch (err: any) { toast.error("Failed to post reply."); }
  };

  const startReply = (reply: any) => {
    setReplyingToId(reply.replyId);
    setReplyTarget({ id: reply.replyId, name: reply.employeeName, text: reply.replyText });
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;
    try { await deleteReply({ replyId: replyToDelete as any, feedbackId: feedbackId as any }).unwrap(); setReplyToDelete(null); }
    catch (err) { console.error("Failed to delete reply", err); }
  };

  const handleUpdateReply = async (replyId: number | string) => {
    if (!editReplyText.trim() || !user) return;
    try {
      await updateReply({ replyId: replyId as any, feedbackId: feedbackId as any, body: { replyText: editReplyText, employeeId: user.id as any } }).unwrap();
      setEditingReplyId(null); setEditReplyText("");
    } catch (err) { console.error("Failed to update reply", err); }
  };

  if (isLoading) return <div style={{ marginTop: 12, fontSize: 11, color: '#64748B' }}>Loading discussion…</div>;

  const flattenReplies = (list: any[] | undefined): any[] => {
    if (!list) return [];
    return (list || []).flatMap(r => [r, ...flattenReplies(r.children || [])]);
  };
  const allReplies = flattenReplies(replies);
  const rootReplies = [...(replies || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderReply = (reply: NonNullable<typeof replies>[0], depth = 0) => {
    const children = [...(reply.children || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return (
      <div key={reply.replyId} style={depth > 0 ? { marginLeft: 16, borderLeft: '2px solid #E2E8F0', paddingLeft: 8 } : {}}>
        <ReplyItem reply={reply} allReplies={allReplies} user={user} authorId={authorId}
          highlightedReplyId={highlightedReplyId} editingReplyId={editingReplyId}
          editReplyText={editReplyText} setEditReplyText={setEditReplyText}
          setEditingReplyId={setEditingReplyId} handleUpdateReply={handleUpdateReply}
          handleScrollToParent={handleScrollToParent} onContextMenu={handleContextMenu}
          isUpdatingReply={isUpdatingReply} />
        {children.map(child => renderReply(child, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F1F5F9', position: 'relative' }} className="space-y-4">
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {rootReplies.map((reply, index) => {
          const currentDate = reply.createdAt ? format(new Date(reply.createdAt), 'yyyy-MM-dd') : '';
          const prevDate = index > 0 && rootReplies[index - 1].createdAt ? format(new Date(rootReplies[index - 1].createdAt), 'yyyy-MM-dd') : '';
          const isNewDay = currentDate !== prevDate;
          return (
            <React.Fragment key={reply.replyId}>
              {isNewDay && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <span className="office-tag-badge" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 99, padding: '3px 10px' }}>
                    {format(new Date(reply.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              {renderReply(reply)}
            </React.Fragment>
          );
        })}
      </div>

      {contextMenu && (
        <div style={{ position: 'absolute', zIndex: 1000, width: 176, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '6px 0', top: contextMenu.y, left: contextMenu.x, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0,0,0,0.05)' }}
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { startReply(contextMenu.reply); setContextMenu(null); }}
            style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            className="hover:bg-[#F1F5F9] transition-colors">
            <svg style={{ width: 14, height: 14, color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          <button onClick={() => { navigator.clipboard.writeText(contextMenu.reply.replyText); setContextMenu(null); }}
            style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            className="hover:bg-[#F1F5F9] transition-colors">
            <svg style={{ width: 14, height: 14, color: '#94A3B8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Text
          </button>
          {contextMenu.reply.employeeId === user?.id && (
            <>
              <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
              <button onClick={() => { setEditingReplyId(contextMenu.reply.replyId); setEditReplyText(contextMenu.reply.replyText); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#F1F5F9] transition-colors">
                <svg style={{ width: 14, height: 14, color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button onClick={() => { setReplyToDelete(contextMenu.reply.replyId); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#FFF5F5] transition-colors">
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Reply input */}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
        {replyTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: '#EEF2FF', border: '1px solid #C7D2FE', borderLeft: '3px solid #6366F1', borderRadius: 10, padding: '6px 12px' }} className="animate-fade-in">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{replyTarget.name}</p>
              <p style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }} className="truncate">"{replyTarget.text}"</p>
            </div>
            <button onClick={() => { setReplyingToId(null); setReplyTarget(null); }}
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#E2E8F0', color: '#64748B', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 10, height: 10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleReply} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="office-avatar-circle" style={{ background: '#6366F1', color: '#FFFFFF', width: 28, height: 28, fontSize: 11 }}>
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: 24, padding: '3px 6px 3px 14px', alignItems: 'center', border: '1px solid #E2E8F0' }}>
            <input ref={mainInputRef} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: 13, height: 32, padding: 0 }}
              placeholder={replyTarget ? `Replying to ${replyTarget.name}…` : 'Add to the conversation…'}
              maxLength={2000}
              value={newReply} onChange={(e) => setNewReply(e.target.value)} />
            <button type="submit" disabled={isReplying || !newReply.trim()}
              style={{ background: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isReplying || !newReply.trim() ? 'not-allowed' : 'pointer', opacity: isReplying || !newReply.trim() ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0 }}>
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Reply Modal */}
      {replyToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 20, width: '100%', maxWidth: 350, padding: 24, textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FFF5F5', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg style={{ width: 22, height: 22, color: '#B91C1C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Delete Message?</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>This will permanently remove your contribution from this thread.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setReplyToDelete(null)} className="office-button-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleDeleteReply} className="office-button-primary" style={{ flex: 1, background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.15)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;