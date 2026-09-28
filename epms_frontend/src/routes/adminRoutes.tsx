import EmployeeList from "../pages/admin/EmployeeList";
import EmployeeForm from "../pages/admin/EmployeeForm";
import EmployeeProfileView from "../pages/admin/EmployeeProfileView";
import DepartmentList from "../pages/admin/DepartmentList";
import DepartmentMembers from "../pages/admin/DepartmentMembers";
import JobLevelList from "../pages/admin/JobLevelList";
import PositionList from "../pages/admin/PositionList";
import HRDashboard from "../pages/admin/HRDashboard";
import TeamList from "../pages/admin/TeamList";
import RolePermissionManagementPage from "../pages/superadmin/RolePermissionManagementPage";
import SuperadminNotificationPage from "../pages/superadmin/SuperadminNotificationPage";
import SuperAdminModule from "../modules/superadmin/SuperAdminModule";
import EmployeeDepartmentHistory from "../pages/admin/org/EmployeeDepartmentHistory";
import RoleLevelPermissionManager from "../pages/admin/org/RoleLevelPermissionManager";
import FinancialYearManagement from "../pages/appraisal/FinancialYearManagement";
import PerformanceCategoryManagement from "../pages/appraisal/PerformanceCategoryManagement";
import AnalyticsDashboard from "../pages/admin/AnalyticsDashboard";

export const adminRoutes = [
  { path: "/hr", element: <HRDashboard /> },
  { path: "/employees", element: <EmployeeList /> },
  { path: "/employees/new", element: <EmployeeForm /> },
  { path: "/employees/edit/:id", element: <EmployeeForm /> },
  { path: "/employees/:id/profile", element: <EmployeeProfileView /> },
  { path: "/employees/:id/departments", element: <EmployeeDepartmentHistory /> },
  { path: "/departments", element: <DepartmentList /> },
  { path: "/departments/:id/members", element: <DepartmentMembers /> },
  { path: "/roles", element: <RolePermissionManagementPage /> },
  { path: "/job-levels", element: <JobLevelList /> },
  { path: "/positions", element: <PositionList /> },
  { path: "/teams", element: <TeamList /> },
  { path: "/permissions", element: <RolePermissionManagementPage /> },
  { path: "/permissions/matrix", element: <RolePermissionManagementPage /> },
  { path: "/permissions/assign", element: <RoleLevelPermissionManager /> },
  { path: "/superadmin", element: <SuperAdminModule /> },
  { path: "/superadmin/roles-permissions", element: <RolePermissionManagementPage /> },
  { path: "/superadmin/notifications", element: <SuperadminNotificationPage /> },
  { path: "/financial-years", element: <FinancialYearManagement /> },
  { path: "/performance-categories", element: <PerformanceCategoryManagement /> },
  { path: "/analytics", element: <AnalyticsDashboard /> }
];
