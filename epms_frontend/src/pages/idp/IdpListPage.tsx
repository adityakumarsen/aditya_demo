import { useMemo, useState, useEffect } from "react";
import type React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, Plus, TrendingUp, User } from "lucide-react";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { useGetActiveDepartmentsQuery } from "../../features/org/departmentApi";
import { IdpStatus } from "../../features/idp/idpTypes";
import type { IdpResponse } from "../../features/idp/idpTypes";
import { useAuth } from "../../hooks/useAuth";
import { useGetIdpsByEmployeeQuery, useGetIdpsByInvolvedUserQuery, useGetIdpsQuery } from "../../services/idpApi";

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "#F1EFE8", text: "#444441", border: "#DDDBD2" },
  ACTIVE: { bg: "#EEF3FD", text: "#0C447C", border: "#B5D4F4" },
  COMPLETED: { bg: "#EAF3DE", text: "#27500A", border: "#B8DCA0" },
  CANCELLED: { bg: "#FCEBEB", text: "#791F1F", border: "#F5C2C2" },
};

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const selectStyle: React.CSSProperties = {
  background: "#F5F6F8",
  border: "0.5px solid #E0E2E8",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  color: "#111827",
  fontFamily: "inherit",
  outline: "none",
};

const COLOR_MAP = {
  blue: { bg: "#EEF3FD", text: "#1A56DB" },
  green: { bg: "#EAF3DE", text: "#27500A" },
  amber: { bg: "#FAEEDA", text: "#633806" },
};

type TabKey = "SELF" | "OTHERS";

const IdpListPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isHR, isManager } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const canViewOthers = isAdmin || isHR || isManager;
  const [activeTab, setActiveTab] = useState<TabKey>("SELF");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    setPage(0);
  }, [deptFilter, statusFilter, activeTab]);

  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000 });
  const employees = employeeData?.content ?? [];
  const { data: allDepartments = [] } = useGetActiveDepartmentsQuery();

  const { data: selfPlansResponse, isLoading: isLoadingSelf } = useGetIdpsByEmployeeQuery(user?.id ?? 0, { skip: !user?.id });
  const { data: allPlansResponse, isLoading: isLoadingAll } = useGetIdpsQuery(undefined, { skip: !isHR && !isAdmin });
  const { data: involvedPlansResponse, isLoading: isLoadingInvolved } = useGetIdpsByInvolvedUserQuery(user?.id ?? 0, { skip: isHR || isAdmin || !user?.id });

  const selfPlans = selfPlansResponse?.data ?? [];
  const othersSource = (isHR || isAdmin) ? (allPlansResponse?.data ?? []) : (involvedPlansResponse?.data ?? []);
  const otherPlans = othersSource.filter(plan => plan.employeeId !== user?.id);
  const activePlans = activeTab === "SELF" || !canViewOthers ? selfPlans : otherPlans;
  const isLoading = activeTab === "SELF" ? isLoadingSelf : ((isHR || isAdmin) ? isLoadingAll : isLoadingInvolved);

  const getEmployee = (id: number) => employees.find(employee => employee.id === id);
  const departments = [
    "All Departments",
    ...allDepartments
      .map(department => department.departmentName)
      .filter((name): name is string => typeof name === "string" && name.trim() !== "")
      .sort((a, b) => a.localeCompare(b)),
  ];

  const filteredPlans = useMemo(() => activePlans.filter(plan => {
    const employee = getEmployee(plan.employeeId);
    const matchesDept = deptFilter === "All Departments" || employee?.currentDepartmentName === deptFilter;
    const matchesStatus = statusFilter === "All Status" || plan.status === statusFilter.toUpperCase();
    return matchesDept && matchesStatus;
  }), [activePlans, deptFilter, statusFilter, employees]);

  const totalPages = Math.ceil(filteredPlans.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginatedPlans = filteredPlans.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const allVisiblePlans = activeTab === "SELF" || !canViewOthers ? selfPlans : otherPlans;
  const activeCount = allVisiblePlans.filter(plan => plan.status === IdpStatus.ACTIVE).length;
  const completedCount = allVisiblePlans.filter(plan => plan.status === IdpStatus.COMPLETED).length;
  const avgProgress = allVisiblePlans.length > 0
    ? Math.round(allVisiblePlans.reduce((sum, plan) => sum + (plan.overallProgress ?? 0), 0) / allVisiblePlans.length)
    : 0;
  const metrics = [
    { label: "Active growth plans", value: activeCount, icon: <Activity size={15} />, color: "blue" as const },
    { label: "Completed plans", value: completedCount, icon: <CheckCircle2 size={15} />, color: "green" as const },
    { label: "Average progress", value: `${avgProgress}%`, icon: <TrendingUp size={15} />, color: "amber" as const },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#1A56DB" }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>IDP overview</h1>
          <p style={{ fontSize: 13, color: "#9EA3B0", marginTop: 2 }}>Tracking capability growth, mentoring focus, and future readiness.</p>
        </div>
        {(isAdmin || isHR) && (
          <button
            onClick={() => navigate("/idp/new")}
            className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
            style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, border: "none" }}
          >
            <Plus size={14} aria-hidden="true" /> Create IDP
          </button>
        )}
      </div>

      {canViewOthers && (
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: 4, display: "inline-flex", gap: 4 }}>
          {[
            { key: "SELF" as const, label: "My IDP", count: selfPlans.length },
            { key: "OTHERS" as const, label: "Team IDPs", count: otherPlans.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 500,
                background: activeTab === tab.key ? "#EEF3FD" : "transparent",
                color: activeTab === tab.key ? "#1A56DB" : "#5A6070",
              }}
            >
              {tab.label} <span style={{ color: activeTab === tab.key ? "#1A56DB" : "#9EA3B0" }}>({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {metrics.map(metric => {
          const colors = COLOR_MAP[metric.color];
          return (
            <div key={metric.label} style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: colors.bg, color: colors.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {metric.icon}
              </div>
              <p style={{ fontSize: 22, fontWeight: 500, color: "#111827", lineHeight: 1, marginTop: 8 }}>{metric.value}</p>
              <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 3 }}>{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "12px 16px" }}>
        <div className="flex flex-wrap gap-2">
          {canViewOthers && activeTab === "OTHERS" && (
            <select value={deptFilter} onChange={event => setDeptFilter(event.target.value)} style={selectStyle}>
              {departments.map(department => <option key={department} value={department}>{department}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={selectStyle}>
            <option>All Status</option>
            <option>Draft</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #E4E6EC" }}>
                {["Employee", "Manager", "Growth focus", "Progress", "Status", "Goals", "Target date", ""].map((heading, index) => (
                  <th key={heading} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: index === 7 ? "right" : "left" }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.length > 0 ? paginatedPlans.map((plan: IdpResponse, index) => {
                const employee = getEmployee(plan.employeeId);
                const avatarColor = AVATAR_COLORS[(plan.employeeName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                const statusStyle = STATUS_STYLE[plan.status] ?? STATUS_STYLE.DRAFT;
                return (
                  <tr key={plan.idpId} style={{ borderBottom: index < paginatedPlans.length - 1 ? "0.5px solid #F0F2F6" : "none" }} className="hover:bg-[#FAFBFF] transition-colors">
                    <td style={{ padding: "11px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {plan.employeeName?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{plan.employeeName}</p>
                          <p style={{ fontSize: 11, color: "#9EA3B0" }}>{employee?.currentDepartmentName ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#EAF3DE", color: "#27500A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <User size={12} aria-hidden="true" />
                        </div>
                        <span style={{ fontSize: 12, color: "#5A6070" }}>{plan.managerName ?? "N/A"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{plan.title}</p>
                      <p style={{ fontSize: 11, color: "#9EA3B0" }}>{plan.summary || "Development plan"}</p>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ width: 110 }}>
                        <div className="flex justify-between" style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#9EA3B0" }}>Growth</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{plan.overallProgress ?? 0}%</span>
                        </div>
                        <div style={{ height: 5, background: "#EEF0F6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${plan.overallProgress ?? 0}%`, borderRadius: 3, background: (plan.overallProgress ?? 0) >= 80 ? "#639922" : (plan.overallProgress ?? 0) >= 40 ? "#1A56DB" : "#D8A21B" }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ background: statusStyle.bg, color: statusStyle.text, border: `0.5px solid ${statusStyle.border}`, fontSize: 11, fontWeight: 500, padding: "3px 8px", borderRadius: 20 }}>
                        {plan.status}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#5A6070" }}>{plan.completedGoalCount}/{plan.goalCount}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#5A6070" }}>{format(parseISO(plan.endDate), "dd/MM/yyyy")}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right" }}>
                      <button onClick={() => navigate(`/idp/${plan.idpId}`)} style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 6, color: "#5A6070" }}>
                        <ChevronRight size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#9EA3B0" }}>No IDPs found for current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2" style={{ borderTop: "0.5px solid #E4E6EC", padding: "10px 16px" }}>
          <p style={{ fontSize: 12, color: "#9EA3B0" }}>
            {filteredPlans.length > 0
              ? `Showing ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, filteredPlans.length)} of ${filteredPlans.length} records`
              : "Showing 0–0 of 0 records"
            }
          </p>
          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                type="button"
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: safePage === 0 ? "#F5F6F8" : "#FFFFFF",
                  border: "0.5px solid #E0E2E8",
                  borderRadius: 6,
                  color: safePage === 0 ? "#D1D5DB" : "#5A6070",
                  cursor: safePage === 0 ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 12, color: "#5A6070", padding: "0 6px" }}>
                Page {safePage + 1} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: safePage >= totalPages - 1 ? "#F5F6F8" : "#FFFFFF",
                  border: "0.5px solid #E0E2E8",
                  borderRadius: 6,
                  color: safePage >= totalPages - 1 ? "#D1D5DB" : "#5A6070",
                  cursor: safePage >= totalPages - 1 ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 16 }}>Development plan starts</p>
          <div className="flex items-end justify-between gap-3" style={{ height: 120 }}>
            {[5, 4, 3, 2, 1, 0].map(monthsAgo => {
              const date = subMonths(new Date(), monthsAgo);
              const monthStart = startOfMonth(date);
              const monthEnd = endOfMonth(date);
              const count = allVisiblePlans.filter(plan => {
                const planStart = parseISO(plan.startDate);
                return planStart >= monthStart && planStart <= monthEnd;
              }).length;
              const height = Math.min(100, (count / Math.max(1, allVisiblePlans.length)) * 100);
              return (
                <div key={monthsAgo} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: 96, background: "#F5F6F8", borderRadius: "4px 4px 0 0", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: `${height || 4}%`, background: "#639922", borderRadius: "4px 4px 0 0" }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#9EA3B0" }}>{format(date, "MMM")}</span>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
};

export default IdpListPage;
