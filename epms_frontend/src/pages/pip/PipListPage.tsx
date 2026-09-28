import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { useGetPipsQuery, useGetPipsByInvolvedUserQuery } from '../../services/pipApi';
import { useAuth } from '../../hooks/useAuth';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useGetActiveDepartmentsQuery } from '../../features/org/departmentApi';
import { format, parseISO, isAfter, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { CheckCircle2, AlertCircle, Plus, ChevronLeft, ChevronRight, Activity, User } from 'lucide-react';
import { Can } from '../../components/Can';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE:      { bg: "#EEF3FD", text: "#0C447C", border: "#B5D4F4" },
  IN_PROGRESS: { bg: "#EEF3FD", text: "#0C447C", border: "#B5D4F4" },
  EXTENDED:    { bg: "#FAEEDA", text: "#633806", border: "#F0D4A4" },
  DRAFT:       { bg: "#F1EFE8", text: "#444441", border: "#DDDBD2" },
  COMPLETED:   { bg: "#EAF3DE", text: "#27500A", border: "#B8DCA0" },
  CLOSED:      { bg: "#FCEBEB", text: "#791F1F", border: "#F5C2C2" },
};

const SEVERITY_STYLE: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: "#FCEBEB", text: "#791F1F" },
  URGENT:   { bg: "#FAEEDA", text: "#633806" },
  STANDARD: { bg: "#F1EFE8", text: "#444441" },
};

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const selectStyle: React.CSSProperties = {
  background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8,
  padding: "6px 10px", fontSize: 12, color: "#111827", fontFamily: "inherit", outline: "none",
};

const PipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isHR, isAdmin, isManager, user } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const scope = searchParams.get('scope') === 'mine' ? 'MINE' : 'ALL';
  const setScope = (newScope: 'ALL' | 'MINE') => {
    if (newScope === 'MINE') {
      setSearchParams({ scope: 'mine' });
    } else {
      setSearchParams({});
    }
  };

  const handleScopeChange = (next: 'ALL' | 'MINE') => {
    setScope(next);
    if (next === 'MINE') setDeptFilter('All Departments');
  };

  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000 });
  const employees = employeeData?.content;
  const { data: allDepartments = [] } = useGetActiveDepartmentsQuery();

  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setPage(0);
  }, [deptFilter, statusFilter, severityFilter, scope]);

  const { data: allPipsResponse, isLoading: isLoadingAll } = useGetPipsQuery(undefined, { skip: !isHR && !isAdmin });
  const shouldFetchInvolved = !!user?.id && (!isHR && !isAdmin || scope === 'MINE');
  const { data: involvedPipsResponse, isLoading: isLoadingInvolved } = useGetPipsByInvolvedUserQuery(user?.id || 0, { skip: !shouldFetchInvolved });

  const isLoading = (isHR || isAdmin)
    ? (isLoadingAll || (scope === 'MINE' && isLoadingInvolved))
    : isLoadingInvolved;
  const allPips = (isHR || isAdmin) ? (allPipsResponse?.data || []) : (involvedPipsResponse?.data || []);
  const myPips = (involvedPipsResponse?.data || []).filter(pip => pip.employeeId === user?.id);
  const visiblePips = scope === 'MINE' ? myPips : allPips;

  const getEmployee = (id: number) => employees?.find(e => e.id === id);

  const departments = [
    'All Departments',
    ...allDepartments
      .map(d => d.departmentName)
      .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
      .sort((a, b) => a.localeCompare(b))
  ];

  const pips = visiblePips.filter(pip => {
    const employee = getEmployee(pip.employeeId);
    const matchesDept = deptFilter === 'All Departments' || employee?.currentDepartmentName === deptFilter;
    let matchesStatus = true;
    if (statusFilter !== 'All Status') {
      if (statusFilter === 'Draft') matchesStatus = pip.status === 'DRAFT';
      else if (statusFilter === 'All Active') matchesStatus = ['ACTIVE', 'IN_PROGRESS', 'EXTENDED'].includes(pip.status);
      else if (statusFilter === 'Extended') matchesStatus = pip.status === 'EXTENDED';
      else if (statusFilter === 'Closed') matchesStatus = pip.status === 'CLOSED';
      else if (statusFilter === 'Completed') matchesStatus = pip.status === 'COMPLETED';
    }
    const matchesSeverity = severityFilter === 'All Severities' || pip.severity === severityFilter.toUpperCase();
    return matchesDept && matchesStatus && matchesSeverity;
  });

  const totalPages = Math.ceil(pips.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedPips = pips.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const completedCount = visiblePips.filter(p => p.status === 'COMPLETED').length;
  const closedCount = visiblePips.filter(p => p.status === 'CLOSED').length;

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#1A56DB" }} />
    </div>
  );

  const metrics = [
    { label: scope === 'MINE' ? 'My active plans' : 'Active plans', value: visiblePips.filter(p => ['ACTIVE','IN_PROGRESS','EXTENDED'].includes(p.status)).length, icon: <Activity size={15} />, color: "blue" as const },
    { label: 'Completed', value: completedCount, icon: <CheckCircle2 size={15} />, color: "green" as const },
    { label: 'Closed', value: closedCount, icon: <AlertCircle size={15} />, color: "red" as const },
  ];

  const COLOR_MAP = {
    blue:  { bg: "#EEF3FD", text: "#1A56DB" },
    green: { bg: "#EAF3DE", text: "#27500A" },
    red:   { bg: "#FCEBEB", text: "#791F1F" },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>PIPs overview</h1>
          <p style={{ fontSize: 13, color: "#9EA3B0", marginTop: 2 }}>Managing growth and accountability across your organisation.</p>
        </div>
        <Can permission="PIP_CREATE">
          <button
            onClick={() => navigate('/pip/new')}
            className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
            style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, border: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}
          >
            <Plus size={14} aria-hidden="true" /> Launch new PIP
          </button>
        </Can>
      </div>

      {/* Scope navigation */}
      {(isHR || isAdmin || isManager) && (
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '4px', display: 'inline-flex', flexWrap: 'wrap', gap: 2 }}>
          <button
            onClick={() => handleScopeChange('ALL')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: scope === 'ALL' ? '#EEF3FD' : 'transparent',
              color: scope === 'ALL' ? '#1A56DB' : '#5A6070'
            }}
          >
            {isHR || isAdmin ? 'All PIPs' : 'Team PIPs'}
          </button>
          <button
            onClick={() => handleScopeChange('MINE')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              background: scope === 'MINE' ? '#EEF3FD' : 'transparent',
              color: scope === 'MINE' ? '#1A56DB' : '#5A6070'
            }}
          >
            My PIPs
          </button>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {metrics.map((m) => {
          const colors = COLOR_MAP[m.color];
          return (
            <div key={m.label} style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "14px 16px" }}>
              <div className="flex justify-between items-start">
                <div style={{ width: 30, height: 30, borderRadius: 8, background: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.icon}
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 500, color: "#111827", lineHeight: 1, marginTop: 8 }}>{String(m.value).padStart(2, "0")}</p>
              <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 3 }}>{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "12px 16px" }}>
        <div className="flex flex-wrap gap-2">
          {(isHR || isAdmin || isManager) && scope === 'ALL' && (
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={selectStyle}>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
            <option>All Status</option>
            <option>Draft</option>
            <option>All Active</option>
            <option>Extended</option>
            <option>Closed</option>
            <option>Completed</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={selectStyle}>
            <option>All Severities</option>
            <option>Standard</option>
            <option>Urgent</option>
            <option>Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #E4E6EC" }}>
                {["Employee", "Manager", "Progress", "Status", "Severity", "Start date", "Next review", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 7 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPips.length > 0 ? paginatedPips.map((pip, idx) => {
                const employee = getEmployee(pip.employeeId);
                const manager = getEmployee(pip.managerId);
                const today = new Date();
                const nextReview = pip.scheduledReviewDates?.find(d => isAfter(parseISO(d), today));
                const avatarColor = AVATAR_COLORS[(employee?.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                const statusStyle = STATUS_STYLE[pip.status] ?? STATUS_STYLE.DRAFT;
                const severityStyle = pip.severity ? SEVERITY_STYLE[pip.severity] ?? SEVERITY_STYLE.STANDARD : null;

                return (
                  <tr key={pip.pipId} style={{ borderBottom: idx < paginatedPips.length - 1 ? "0.5px solid #F0F2F6" : "none" }}
                    className="hover:bg-[#FAFBFF] transition-colors">
                    <td style={{ padding: "11px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {employee?.staffName?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{employee?.staffName ?? "Unknown"}</p>
                          <p style={{ fontSize: 11, color: "#9EA3B0" }}>{employee?.currentDepartmentName ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EEF3FD", color: "#1A56DB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <User size={12} aria-hidden="true" />
                        </div>
                        <span style={{ fontSize: 12, color: "#5A6070" }}>{manager?.staffName ?? "N/A"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ width: 100 }}>
                        <div className="flex justify-between" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#9EA3B0" }}>Score</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{pip.overallProgress ?? 0}%</span>
                        </div>
                        <div style={{ height: 5, background: "#EEF0F6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pip.overallProgress ?? 0}%`, borderRadius: 3, background: (pip.overallProgress ?? 0) >= 80 ? "#639922" : (pip.overallProgress ?? 0) >= 50 ? "#1A56DB" : "#E24B4A" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.text, border: `0.5px solid ${statusStyle.border}`, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20 }}>
                        {pip.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      {severityStyle ? (
                        <span style={{ background: severityStyle.bg, color: severityStyle.text, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20 }}>
                          {pip.severity}
                        </span>
                      ) : <span style={{ fontSize: 12, color: "#9EA3B0" }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#5A6070" }}>
                      {format(parseISO(pip.startDate), "dd/MM/yyyy")}
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#5A6070" }}>
                      {nextReview ? format(parseISO(nextReview), "dd/MM/yyyy") : "—"}
                    </td>
                    <td style={{ padding: "11px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/pip/${pip.pipId}`)}
                        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 6, color: "#5A6070" }}
                        className="hover:bg-info-fill hover:text-[#1A56DB] transition-colors"
                      >
                        <ChevronRight size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#9EA3B0" }}>No PIPs found for current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2" style={{ borderTop: "0.5px solid #E4E6EC", padding: "10px 16px" }}>
          <p style={{ fontSize: 12, color: "#9EA3B0" }}>
            {pips.length > 0 
              ? `Showing ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, pips.length)} of ${pips.length} records`
              : "Showing 0–0 of 0 records"
            }
          </p>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: safePage === 0 ? '#F5F6F8' : '#FFFFFF',
                  border: '0.5px solid #E0E2E8',
                  borderRadius: 6,
                  color: safePage === 0 ? '#D1D5DB' : '#5A6070',
                  cursor: safePage === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: '#5A6070', padding: '0 6px' }}>
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: safePage >= totalPages - 1 ? '#F5F6F8' : '#FFFFFF',
                  border: '0.5px solid #E0E2E8',
                  borderRadius: 6,
                  color: safePage >= totalPages - 1 ? '#D1D5DB' : '#5A6070',
                  cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PipListPage;