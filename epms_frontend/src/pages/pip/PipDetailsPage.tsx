import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetPipByIdQuery,
  useGetObjectivesByPipQuery,
  useGetReviewsByPipQuery,
} from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import { useDownloadReportMutation } from '../../features/report/reportApi';
import {
  Plus, Lock, Calendar, ChevronRight, MessageSquare,
  TrendingUp, FileText, CheckCircle2, AlertCircle, Play, Download
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

import { Can } from '../../components/Can';
import ObjectiveStatusBadge from '../../components/pip/ObjectiveStatusBadge';
import PipStatusBadge from '../../components/pip/PipStatusBadge';
import ReviewModal from '../../components/pip/ReviewModal';
import ObjectiveModal from '../../components/pip/ObjectiveModal';
import ProgressModal from '../../components/pip/ProgressModal';
import FinalizeModal from '../../components/pip/FinalizeModal';
import ObjectiveProgressList from '../../components/pip/ObjectiveProgressList';
import {
  useActivatePipMutation,
  useDeletePipMutation,
  useExtendPipMutation,
  useUpdatePipMutation,
  useCreateReviewMutation,
  useCreateObjectiveMutation,
  useAddProgressMutation,
  useFinalizePipMutation,
  useUpdateObjectiveMutation,
  useUpdateObjectiveStatusMutation
} from '../../services/pipApi';
import { PipStatus, PipOutcome, ObjectiveStatus } from '../../features/pip/types';

const OBJECTIVE_STATUS_COLOR: Record<string, string> = {
  COMPLETED:   '#27500A',
  IN_PROGRESS: '#1A56DB',
  NOT_STARTED: '#9EA3B0',
};

const PipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pipId = Number(id);

  const { data: pipResponse, isLoading: isPipLoading } = useGetPipByIdQuery(pipId);
  const { data: objectivesResponse } = useGetObjectivesByPipQuery(pipId);
  const { data: reviewsResponse } = useGetReviewsByPipQuery(pipId);

  const pip = pipResponse?.data;
  const objectives = objectivesResponse?.data ?? [];
  const reviews = reviewsResponse?.data ?? [];
  const { user, isHR, isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const isCurrentEmployee = user?.id === pip?.employeeId;
  const isCurrentManager = user?.id === pip?.managerId;

  const [activatePip] = useActivatePipMutation();
  const [deletePip] = useDeletePipMutation();
  const [extendPip] = useExtendPipMutation();
  const [updatePip] = useUpdatePipMutation();
  const [createReview] = useCreateReviewMutation();
  const [createObjective] = useCreateObjectiveMutation();
  const [updateObjective] = useUpdateObjectiveMutation();
  const [updateObjectiveStatus] = useUpdateObjectiveStatusMutation();
  const [addProgress] = useAddProgressMutation();
  const [finalizePip] = useFinalizePipMutation();
  const [downloadReport, { isLoading: isExporting }] = useDownloadReportMutation();

  const { data: employeesData } = useGetEmployeesQuery({ page: 0, size: 1000 });
  const allEmployees = employeesData?.content || [];

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [editingObjective, setEditingObjective] = useState<any>(null);
  const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);
  const [privateNote, setPrivateNote] = useState('');
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState('');

  useEffect(() => {
    if (pip) {
      setPrivateNote(isCurrentEmployee ? (pip.employeePrivateNote || '') : (pip.managerPrivateNote || ''));
      setEditedReason(pip.reason || '');
    }
  }, [pip, isCurrentEmployee]);

  if (isPipLoading || !pip) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Orchestrating Workspace…</div>
  );

  const canManage = isHR || isCurrentManager;

  const totalObjectives = objectives.length;
  const achievedObjectives = objectives.filter(o => o.status === 'COMPLETED').length;
  const avgProgress = totalObjectives > 0
    ? Math.round(objectives.reduce((acc, obj) => acc + (obj.currentProgress || 0), 0) / totalObjectives) : 0;
  const daysElapsed = differenceInDays(new Date(), parseISO(pip.startDate));
  const totalDuration = differenceInDays(parseISO(pip.endDate), parseISO(pip.startDate));
  const nextReviewDate = pip.scheduledReviewDates?.find(d => parseISO(d) > new Date());

  const handleActivate = async () => {
    try { await activatePip(pipId).unwrap(); toast.success('PIP Activated Successfully!'); }
    catch (err: any) { toast.error('Failed to activate PIP. Check permissions or state.'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this PIP? This action cannot be undone.')) return;
    try { await deletePip(pipId).unwrap(); navigate('/pip'); }
    catch (err: any) { toast.error('Failed to delete PIP. Check permissions.'); }
  };

  const handleCreateReview = async (data: any) => {
    try { await createReview({ ...data, pipId }).unwrap(); setIsReviewModalOpen(false); toast.success('Review added successfully!'); }
    catch (err: any) { toast.error('Failed to add review. Check permissions.'); }
  };

  const handleCreateObjective = async (data: any) => {
    try { await createObjective({ ...data, pipId }).unwrap(); setIsObjectiveModalOpen(false); }
    catch (err) { throw err; }
  };

  const handleEditObjective = async (data: any) => {
    try { await updateObjective({ id: editingObjective.objectiveId, body: data }).unwrap(); setEditingObjective(null); }
    catch (err) { throw err; }
  };

  const handleSaveReason = async () => {
    try { await updatePip({ id: pipId, body: { reason: editedReason } }).unwrap(); setIsEditingReason(false); toast.success('PIP Reason updated successfully!'); }
    catch (err: any) { toast.error('Failed to update reason. Check permissions.'); }
  };

  const handleStatusChange = async (objectiveId: number, status: ObjectiveStatus) => {
    try { await updateObjectiveStatus({ id: objectiveId, status }).unwrap(); }
    catch (err: any) { toast.error('Failed to update objective status. Check permissions.'); }
  };

  const handleAddProgress = async (data: any) => {
    if (!selectedObjectiveId) return;
    try {
      await addProgress({ ...data, objectiveId: selectedObjectiveId }).unwrap();
      const objective = objectives.find(o => o.objectiveId === selectedObjectiveId);
      if (data.progressPercent === 100 && objective?.status !== 'COMPLETED') {
        await updateObjectiveStatus({ id: selectedObjectiveId, status: ObjectiveStatus.COMPLETED }).unwrap();
      } else if (data.progressPercent < 100 && objective?.status === 'COMPLETED') {
        await updateObjectiveStatus({ id: selectedObjectiveId, status: ObjectiveStatus.IN_PROGRESS }).unwrap();
      }
      setIsProgressModalOpen(false);
      toast.success('Progress logged successfully!');
    } catch (err: any) { toast.error('Failed to log progress. Check permissions.'); }
  };

  const handleFinalize = async (data: { outcome: PipOutcome; comment: string; newEndDate?: string; scheduledReviewDates?: string[] }) => {
    try {
      if (data.outcome === PipOutcome.EXTEND && data.newEndDate) {
        await extendPip({ id: pipId, body: { newEndDate: data.newEndDate, scheduledReviewDates: data.scheduledReviewDates } }).unwrap();
      }
      await finalizePip({ pipId, outcome: data.outcome, comment: data.comment }).unwrap();
      setIsFinalizeModalOpen(false);
      toast.success(`PIP Finalized as ${data.outcome}`);
    } catch (err: any) { toast.error('Failed to finalize. Check fields and permissions.'); }
  };

  const handleSavePrivateNote = async () => {
    try {
      const body = isCurrentEmployee ? { employeePrivateNote: privateNote } : { managerPrivateNote: privateNote };
      await updatePip({ id: pipId, body }).unwrap();
      toast.success('Private note saved successfully!');
    } catch (err: any) { toast.error('Failed to save private note. Check permissions.'); }
  };

  const toggleObjectiveHistory = (id: number) => {
    setExpandedObjectives(prev => prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]);
  };

  const handleExportPdf = async () => {
    try {
      await downloadReport({
        endpoint: 'pip-detail',
        params: { pipId },
        fileName: `PIP_${pipId}_Detail_Report.pdf`,
      }).unwrap();
      toast.success('PIP report exported successfully!');
    } catch (err: any) {
      toast.error('Export failed. PIP must be COMPLETED or CLOSED.');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}
          onClick={() => navigate('/pip')}>PIPs</span>
        <ChevronRight size={12} style={{ color: '#9EA3B0' }} />
        <span style={{ fontSize: 11, fontWeight: 500, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isCurrentEmployee ? user?.staffName?.toUpperCase() : `PIP ID: ${pip.pipId}`}
        </span>
      </nav>

      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 20px' }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            {isEditingReason ? (
              <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 6 }}>
                <input value={editedReason} onChange={e => setEditedReason(e.target.value)}
                  style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 15, fontWeight: 500, color: '#111827', outline: 'none', minWidth: 280, flex: 1 }} />
                <button onClick={handleSaveReason} style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500 }}>Save</button>
                <button onClick={() => setIsEditingReason(false)} style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500 }}>Cancel</button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2" style={{ marginBottom: 4 }}>
                <h1 style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{pip.reason || 'Performance Improvement Plan'}</h1>
                <Can permission="PIP_MANAGE">
                  {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                    <button onClick={() => setIsEditingReason(true)} style={{ fontSize: 11, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}
                      className="hover:text-[#1A56DB] transition-colors">Edit</button>
                  )}
                </Can>
              </div>
            )}
            <p style={{ fontSize: 12, color: '#9EA3B0' }}>
              Started: {format(parseISO(pip.startDate), 'dd/MM/yyyy')} &bull; Duration: {totalDuration} Days &bull;
              Subject: <span style={{ color: '#111827', fontWeight: 500 }}>{allEmployees.find(e => e.id === pip.employeeId)?.staffName || `ID ${pip.employeeId}`}</span> &bull;
              Manager: <span style={{ color: '#1A56DB', fontWeight: 500 }}>{allEmployees.find(e => e.id === pip.managerId)?.staffName || `ID ${pip.managerId}`}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <PipStatusBadge status={pip.status} />
            <Can permission="PIP_MANAGE">
              {pip.status === PipStatus.DRAFT && canManage && (
                <button onClick={handleActivate}
                  style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Play size={11} fill="currentColor" /> Activate PIP
                </button>
              )}
              {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                <button onClick={() => setIsFinalizeModalOpen(true)}
                  style={{ background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500 }}>
                  Finalize PIP
                </button>
              )}
              {pip.status === PipStatus.DRAFT && (
                <button onClick={handleDelete}
                  style={{ background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F5BFBF', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500 }}>
                  Delete PIP
                </button>
              )}
            </Can>
            <Can permission="REPORT_EXPORT">
            <button
              id="export-pip-pdf-btn"
              onClick={handleExportPdf}
              disabled={isExporting || (pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED)}
              title={pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED ? 'Only available when PIP is COMPLETED or CLOSED' : 'Export PIP as PDF'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: (pip.status === PipStatus.COMPLETED || pip.status === PipStatus.CLOSED) ? '#F0FDF4' : '#F5F6F8',
                color: (pip.status === PipStatus.COMPLETED || pip.status === PipStatus.CLOSED) ? '#15803D' : '#9EA3B0',
                border: `0.5px solid ${(pip.status === PipStatus.COMPLETED || pip.status === PipStatus.CLOSED) ? '#BBF7D0' : '#E0E2E8'}`,
                borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 500,
                cursor: (pip.status === PipStatus.COMPLETED || pip.status === PipStatus.CLOSED) ? 'pointer' : 'not-allowed',
                opacity: isExporting ? 0.7 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Download size={11} />
              {isExporting ? 'Exporting…' : 'Export PDF'}
            </button>
            </Can>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Left column */}
        <div className="space-y-4">
          {/* Progress card */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 20px' }}>
            <div className="flex items-end justify-between" style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance Progress</p>
              <span style={{ fontSize: 36, fontWeight: 500, color: '#1A56DB', lineHeight: 1 }}>{avgProgress}%</span>
            </div>
            <div style={{ background: '#F0F2F6', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', background: '#1A56DB', width: `${avgProgress}%`, transition: 'width 0.5s' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Time Elapsed', value: `${daysElapsed} Days`, icon: TrendingUp },
                { label: 'Objectives Met', value: `${achievedObjectives} / ${totalObjectives}`, icon: FileText },
                { label: 'Next Check-in', value: nextReviewDate ? format(parseISO(nextReviewDate), 'dd/MM') : 'None Set', icon: Calendar },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#F5F6F8', borderRadius: 8, padding: '10px 12px' }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                    <stat.icon size={12} style={{ color: '#1A56DB' }} />
                    <p style={{ fontSize: 9, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ padding: '10px 16px', background: '#FAFBFF', borderBottom: '0.5px solid #E4E6EC' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Improvement Objectives</p>
              <Can permission="PIP_MANAGE">
                {canManage && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
                  <button onClick={() => setIsObjectiveModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#1A56DB', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Plus size={12} strokeWidth={3} /> Add Objective
                  </button>
                )}
              </Can>
            </div>
            <div style={{ padding: '16px 20px' }} className="space-y-8">
              {objectives.length > 0 ? objectives.map(objective => (
                <div key={objective.objectiveId} className="flex gap-4">
                  <div style={{ width: 3, borderRadius: 2, background: OBJECTIVE_STATUS_COLOR[objective.status] || '#9EA3B0', flexShrink: 0, alignSelf: 'stretch', minHeight: 60 }} />
                  <div style={{ flex: 1 }}>
                    <div className="flex flex-wrap items-center justify-between gap-2" style={{ marginBottom: 4 }}>
                      <div className="flex items-center gap-2">
                        <h4 style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{objective.title}</h4>
                        <Can permission="PIP_MANAGE">
                          {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                            <button onClick={() => setEditingObjective(objective)}
                              style={{ fontSize: 10, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                              className="hover:text-[#1A56DB] transition-colors">Edit</button>
                          )}
                        </Can>
                      </div>
                      <div className="flex items-center gap-2">
                        <ObjectiveStatusBadge status={objective.status} />
                        <Can permission="PIP_MANAGE">
                          {canManage && pip.status !== PipStatus.DRAFT && pip.status !== PipStatus.CLOSED && (
                            <select value={objective.status} onChange={e => handleStatusChange(objective.objectiveId, e.target.value as ObjectiveStatus)}
                              style={{ fontSize: 10, background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '3px 6px', color: '#5A6070', outline: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {objective.status === 'NOT_STARTED' && <option value="NOT_STARTED">Not Started</option>}
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="COMPLETED">Completed</option>
                            </select>
                          )}
                        </Can>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#5A6070', lineHeight: 1.6, marginBottom: 8 }}>{objective.description}</p>
                    <div className="flex flex-wrap items-center gap-3" style={{ fontSize: 11, color: '#5A6070', marginBottom: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> Target: {format(parseISO(objective.targetDate), 'dd/MM/yyyy')}
                      </span>
                      <span style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 4, padding: '1px 7px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{objective.successCriteria}</span>
                      <Can permission="PIP_CREATE">
                        {isCurrentEmployee && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
                          <button onClick={() => { setSelectedObjectiveId(objective.objectiveId); setIsProgressModalOpen(true); }}
                            style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 500, color: '#1A56DB', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Log Progress
                          </button>
                        )}
                      </Can>
                    </div>
                    <div style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: 6, fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Current Progress</span>
                        <span style={{ color: '#1A56DB' }}>{objective.currentProgress || 0}%</span>
                      </div>
                      <div style={{ background: '#E0E2E8', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#1A56DB', width: `${objective.currentProgress || 0}%`, transition: 'width 0.5s' }} />
                      </div>
                    </div>
                    <button onClick={() => toggleObjectiveHistory(objective.objectiveId)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'none', border: 'none', cursor: 'pointer' }}
                      className="hover:text-[#1A56DB] transition-colors">
                      Progress History
                      <ChevronRight size={12} style={{ transform: expandedObjectives.includes(objective.objectiveId) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                    {expandedObjectives.includes(objective.objectiveId) && (
                      <div style={{ marginTop: 8 }}>
                        <ObjectiveProgressList objectiveId={objective.objectiveId} hideTitle />
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <p style={{ fontSize: 12, color: '#9EA3B0' }}>No objectives defined for this PIP</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <aside className="space-y-4">
          {/* Milestone timeline */}
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>Milestone Timeline</p>
            <div style={{ position: 'relative', paddingLeft: 28 }} className="space-y-6">
              <div style={{ position: 'absolute', left: 10, top: 6, bottom: 6, width: 1, background: '#E4E6EC' }} />
              <div className="relative">
                <div style={{ position: 'absolute', left: -24, top: 2, width: 18, height: 18, borderRadius: '50%', background: '#EAF3DE', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={10} style={{ color: '#27500A' }} />
                </div>
                <p style={{ fontSize: 10, color: '#9EA3B0', marginBottom: 2 }}>{format(parseISO(pip.startDate), 'dd/MM')}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>PIP Initiation</p>
              </div>
              {pip.scheduledReviewDates?.map((date, i) => {
                const mDate = parseISO(date);
                const isPast = mDate < new Date();
                const isDone = reviews.some(r => Math.abs(differenceInDays(parseISO(r.reviewDate), mDate)) <= 3);
                return (
                  <div key={i} className="relative">
                    <div style={{ position: 'absolute', left: -24, top: 2, width: 18, height: 18, borderRadius: '50%', background: isDone ? '#EAF3DE' : isPast ? '#FCEBEB' : '#EEF3FD', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDone ? <CheckCircle2 size={10} style={{ color: '#27500A' }} /> : isPast ? <AlertCircle size={10} style={{ color: '#791F1F' }} /> : null}
                    </div>
                    <p style={{ fontSize: 10, color: '#9EA3B0', marginBottom: 2 }}>{format(parseISO(date), 'dd/MM')}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>Check-in Session</p>
                  </div>
                );
              })}
              <div className="relative">
                <div style={{ position: 'absolute', left: -24, top: 2, width: 18, height: 18, borderRadius: '50%', background: pip.status === 'COMPLETED' ? '#EAF3DE' : '#F5F6F8', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {pip.status === 'COMPLETED' && <CheckCircle2 size={10} style={{ color: '#27500A' }} />}
                </div>
                <p style={{ fontSize: 10, color: '#9EA3B0', marginBottom: 2 }}>{format(parseISO(pip.endDate), 'dd/MM')}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>Final Determination</p>
              </div>
            </div>
          </div>

          {/* Private notes */}
          {(isCurrentEmployee || isCurrentManager) && (
            <div style={{ background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 12, padding: '16px 18px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, background: '#FFFFFF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={13} style={{ color: '#1A56DB' }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {isCurrentEmployee ? 'Employee Private Notes' : "Manager's Private Notes"}
                </p>
              </div>
              <textarea value={privateNote} onChange={e => setPrivateNote(e.target.value)}
                style={{ background: '#FFFFFF', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#0C447C', outline: 'none', width: '100%', minHeight: 100, resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
                placeholder={isCurrentEmployee ? 'Your private thoughts (only visible to you)…' : 'Private manager notes (not visible to employee)…'} />
              <button onClick={handleSavePrivateNote}
                style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, width: '100%', cursor: 'pointer' }}>
                Save Private Note
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Progress Ledger */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '12px 20px', background: '#FAFBFF', borderBottom: '0.5px solid #E4E6EC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 18, background: '#1A56DB', borderRadius: 2 }} />
            <p style={{ fontSize: 11, fontWeight: 500, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress Ledger</p>
          </div>
          <Can permission="PIP_MANAGE">
            {canManage && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
              <button onClick={() => setIsReviewModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: '#1A56DB', background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 20, padding: '4px 10px' }}>
                <Plus size={12} /> Add Entry
              </button>
            )}
          </Can>
        </div>
        <div>
          {reviews.length > 0 ? reviews.map((log, idx) => (
            <div key={log.reviewId} style={{ padding: '16px 20px', borderBottom: idx < reviews.length - 1 ? '0.5px solid #F0F2F6' : 'none' }}
              className="hover:bg-[#FAFBFF] transition-colors">
              <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 500, background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 4, padding: '2px 8px' }}>
                  {format(parseISO(log.reviewDate), 'dd/MM/yyyy')}
                </span>
                <span style={{ fontSize: 12, color: '#5A6070', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={12} />
                  Formal Review by <span style={{ color: '#1A56DB', fontWeight: 500, marginLeft: 3 }}>{allEmployees.find(e => e.id === log.createdBy)?.staffName || 'Manager'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <p style={{ fontSize: 13, color: '#111827', lineHeight: 1.6 }}>{log.progressSummary}</p>
                </div>
                <div className="space-y-3">
                  {log.managerFeedback && (
                    <div style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 9, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Feedback</p>
                      <p style={{ fontSize: 12, color: '#5A6070', lineHeight: 1.5 }}>{log.managerFeedback}</p>
                    </div>
                  )}
                  {log.nextAction && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F5F6F8', borderRadius: 8, padding: '8px 12px' }}>
                      <TrendingUp size={12} style={{ color: '#1A56DB', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#111827', fontWeight: 500 }}>{log.nextAction}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: 12, color: '#9EA3B0' }}>No entries in ledger</div>
          )}
        </div>
      </div>

      {isReviewModalOpen && <ReviewModal onClose={() => setIsReviewModalOpen(false)} onSave={handleCreateReview} />}
      {isObjectiveModalOpen && <ObjectiveModal pipStartDate={pip.startDate} onClose={() => setIsObjectiveModalOpen(false)} onSave={handleCreateObjective} />}
      {editingObjective && <ObjectiveModal initialData={editingObjective} onClose={() => setEditingObjective(null)} onSave={handleEditObjective} />}
      {isProgressModalOpen && selectedObjectiveId && (
        <ProgressModal onClose={() => setIsProgressModalOpen(false)} onSave={handleAddProgress}
          initialProgress={objectives.find(o => o.objectiveId === selectedObjectiveId)?.currentProgress || 0} />
      )}
      {isFinalizeModalOpen && (
        <FinalizeModal currentEndDate={pip.endDate} existingReviewDates={pip.scheduledReviewDates}
          onClose={() => setIsFinalizeModalOpen(false)} onSave={handleFinalize} />
      )}
    </div>
  );
};

export default PipDetailsPage;
