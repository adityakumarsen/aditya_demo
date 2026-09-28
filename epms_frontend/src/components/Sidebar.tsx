import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { DailoqaLogo } from "./DailoqaLogo";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  MessageSquare,
  TrendingUp,
  BarChart3,
  ChevronDown,
  LogOut,
  Building2,
  ShieldCheck,
  Briefcase,
  Zap,
  Target,
  History,
  Calendar,
  Layers,
  X,
  FileClock,
  Database,
  GraduationCap,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  hrOnly?: boolean;
  end?: boolean;
  privilegedOnly?: boolean;
  hideForPrivileged?: boolean;
  hideForAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Executive Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Assigned Mentees", to: "/manager/mentees", icon: Users },
  { label: "Performance Appraisals", to: "/appraisal", icon: ClipboardCheck, end: true },
  { label: "Performance Pulse", to: "/performance-history/admin", icon: History, adminOnly: true },
  { label: "Team Pulse", to: "/performance-history/manager", icon: History, privilegedOnly: true, hideForAdmin: true },
  { label: "Continuous Feedback", to: "/continuous-feedback", icon: MessageSquare },
  { label: "1-on-1 Sync Meetings", to: "/meetings", icon: Users, hideForAdmin: true },
  { label: "PIP Recovery Plans", to: "/pip", icon: TrendingUp, end: true },
  { label: "IDP Development Plans", to: "/idp", icon: GraduationCap, end: true },
  { label: "Strategic Analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
  { label: "System Audit Logs", to: "/audit-logs", icon: FileClock },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Employees Directory", to: "/employees", icon: Users },
  { label: "Departments", to: "/departments", icon: Building2 },
  { label: "Job Levels & Bands", to: "/job-levels", icon: Zap },
  { label: "Positions & Tracks", to: "/positions", icon: Briefcase },
  { label: "Organizational Teams", to: "/teams", icon: Users },
  { label: "Financial Cycles", to: "/financial-years", icon: Calendar },
  { label: "Evaluation Criteria", to: "/performance-categories", icon: Layers },
  { label: "Role & Permissions", to: "/superadmin/roles-permissions", icon: ShieldCheck, adminOnly: true },
  { label: "Security Roles", to: "/roles", icon: ShieldCheck, adminOnly: true },
  { label: "Access Permissions", to: "/permissions", icon: ShieldCheck, adminOnly: true, end: true },
  { label: "Permissions Matrix", to: "/permissions/matrix", icon: ShieldCheck, adminOnly: true },
  { label: "Assign Permissions", to: "/permissions/assign", icon: Zap, adminOnly: true },
  { label: "Record Management", to: "/admin/records", icon: Database, adminOnly: true },
];

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { logout, isAdmin, isHR, isManager, isIntern, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();
  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);

  const isInternUser = isIntern || (!isAdmin && !isHR && !isManager);

  const baseNav = NAV_ITEMS.filter((item) => {
    if (item.hideForAdmin && isAdmin) return false;
    switch (item.label) {
      case "Assigned Mentees":    return isManager || isHR || isAdmin;
      case "Performance Pulse":   return hasPermission("REPORT_VIEW_ALL");
      case "Team Pulse":          return hasPermission("APPRAISAL_VIEW_TEAM") && !isAdmin && !isHR;
      case "Continuous Feedback": return true;
      case "1-on-1 Sync Meetings":return !isAdmin;
      case "PIP Recovery Plans":  return hasPermission("PIP_VIEW_OWN") || hasPermission("PIP_CREATE");
      case "IDP Development Plans": return true;
      case "Strategic Analytics": return hasPermission("REPORT_VIEW_ALL");
      case "System Audit Logs":   return isAdmin || hasRole("AUDIT_VIEWER");
      default:                    return true;
    }
  });

  const filteredNav = baseNav.flatMap((item: NavItem): NavItem[] => {
    if (item.to === "/dashboard") {
      const adjusted: NavItem = {
        ...item,
        label: isInternUser ? "Intern Dashboard" : item.label,
      };
      if (isInternUser) {
        const portalItem: NavItem = {
          label: "Intern Learning Portal",
          to: "/intern",
          icon: GraduationCap,
          end: true,
        };
        return [adjusted, portalItem];
      }
      return [adjusted];
    }
    return [item];
  });

  const perfSubItems: Array<{ to: string; label: string; end?: boolean }> = [
    { to: "/kpi", label: "KPI Intelligence Hub", end: true },
    ...(hasPermission("KPI_VIEW_OWN") ? [{ to: "/kpi/my", label: "My Goals & KRAs" }] : []),
    ...(hasPermission("KPI_VIEW_OWN") && user ? [{ to: `/kpi/history/${user.id}`, label: "My KPI Journey" }] : []),
    ...(hasPermission("KPI_VIEW_TEAM") ? [{ to: "/kpi/team", label: "Team Performance" }] : []),
    ...(isManager
      ? [
          { to: "/manager/tasks", label: "Team Tasks & Goals" },
          { to: "/manager/technical-capabilities", label: "Technical Capabilities" },
          { to: "/manager/evidence", label: "Evidence Reviews" },
        ]
      : []),
    ...(isHR || isAdmin
      ? [{ to: "/kpi/org-history", label: "Org KPI History" }]
      : []),
    ...(isManager && !isHR && !isAdmin
      ? [{ to: "/kpi/org-history", label: "Team KPI History" }]
      : []),
    ...(hasPermission("KPI_LIBRARY_MANAGE")
      ? [
          { to: "/kpi/manage", label: "Goal Management" },
          { to: "/kpi/library", label: "KRA Library" },
          { to: "/kpi/categories", label: "KPI Categories" },
        ]
      : []),
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all duration-150 group ${
      isActive
        ? "bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs border border-indigo-100/80"
        : "text-slate-600 font-normal hover:bg-slate-100/80 hover:text-slate-900"
    }`;

  const iconClass = (isActive: boolean) =>
    `transition-colors shrink-0 ${
      isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
    }`;

  return (
    <aside
      className="flex flex-col h-screen bg-white shrink-0 border-r border-slate-200/80 select-none"
      style={{ width: 240 }}
    >
      {/* Dailoqa Brand Header */}
      <div className="flex items-center justify-between px-5 py-4.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <DailoqaLogo size="sm" showTagline={false} />
          <span className="bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-200/60">
            PMS
          </span>
        </div>
        {onClose && (
          <button
            className="md:hidden flex items-center justify-center rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Core Intelligence */}
        <div>
          <div className="px-3 pb-1.5 text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
            Core Intelligence
          </div>
          <div className="space-y-0.5">
            {filteredNav.map((item) => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={navItemClass(isActive)}
                  onClick={handleNavClick}
                >
                  <item.icon size={16} className={iconClass(isActive)} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Performance & KRAs Accordion */}
        <div>
          <button
            onClick={() => setPerfOpen(!perfOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group"
          >
            <span className="flex items-center gap-2.5 font-normal">
              <Target size={16} className="text-slate-400 group-hover:text-slate-600" />
              KRAs & Objectives
            </span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                perfOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {perfOpen && (
            <div className="ml-5 pl-2.5 mt-1 border-l border-slate-200/80 space-y-0.5">
              {perfSubItems.map((sub) => {
                const isActive = sub.end
                  ? location.pathname === sub.to
                  : location.pathname.startsWith(sub.to);
                return (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={`block px-2.5 py-1.5 rounded-lg text-[12.5px] transition-colors ${
                      isActive
                        ? "text-indigo-700 font-semibold bg-indigo-50/70"
                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                    }`}
                    onClick={handleNavClick}
                  >
                    {sub.label}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Governance & Administration */}
        {(isAdmin || isHR) && (
          <div>
            <button
              onClick={() => setMgmtOpen(!mgmtOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 transition-colors group"
            >
              <span className="flex items-center gap-2.5 font-normal">
                <Building2 size={16} className="text-slate-400 group-hover:text-slate-600" />
                Org Governance
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  mgmtOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mgmtOpen && (
              <div className="ml-5 pl-2.5 mt-1 border-l border-slate-200/80 space-y-0.5">
                {ADMIN_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={`block px-2.5 py-1.5 rounded-lg text-[12.5px] transition-colors ${
                        isActive
                          ? "text-indigo-700 font-semibold bg-indigo-50/70"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                      }`}
                      onClick={handleNavClick}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200">
              {user?.staffName?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-slate-800 truncate">
                {user?.staffName || user?.username || "Authorized User"}
              </div>
              <div className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wide truncate">
                {isAdmin ? "Super Admin" : isHR ? "HR Partner" : isManager ? "Tech Manager" : "Intern"}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
