import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./hooks/reduxHooks";
import { useGetMeQuery } from "./features/auth/authApi";
import { setUser } from "./features/auth/authSlice";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/MainLayout";
// Routes
import {
  publicRoutes,
  appraisalRoutes,
  adminRoutes,
  pipRoutes,
  idpRoutes,
  generalRoutes,
  kpiRoutes,
  continuousRoutes,
  managerRoutes,
} from "./routes";
import { ActiveCycleProvider } from "./context/ActiveCycleContext";
import KpiCategoryManager from './pages/kpi/KpiCategoryManager';
import AuditLogPage from './pages/admin/AuditLogPage';
import SystemRecordsPage from './pages/admin/SystemRecordsPage';
import SuperAdminModule from './modules/superadmin/SuperAdminModule';
import SuperadminNotificationPage from './pages/superadmin/SuperadminNotificationPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ChangePasswordPage from './pages/ChangePasswordPage';

// Specialized Manager Component (Temporary here, can be moved later)
const ApprovalPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Manager Approval Page</h1></div>;

const App = () => {
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);

  const { data: userData, isSuccess } = useGetMeQuery(undefined, {
    skip: !accessToken || !!user,
  });

  useEffect(() => {
    if (isSuccess && userData) {
      dispatch(setUser(userData));
    }
  }, [isSuccess, userData, dispatch]);

  // Sync logout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken" && !e.newValue) {
        dispatch({ type: "auth/logout" });
        window.location.href = "/login";
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Protected Routes Wrapper */}
        <Route element={<ProtectedRoute />}>
          {/* Fullscreen Security / Credential Rotation */}
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route element={<ActiveCycleProvider><MainLayout /></ActiveCycleProvider>}>
            {/* General Routes (Dashboard, Profile, etc.) */}
            {generalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Continuous Feedback & Performance History Routes */}
            {continuousRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Appraisal Workflow Routes */}
            {appraisalRoutes.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* PIP Routes */}
            {pipRoutes.filter(r => !r.adminOnly).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* IDP Routes */}
            {idpRoutes.filter(r => r.path !== "/idp/new").map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* KPI General Routes */}
            {kpiRoutes.filter(r => !['/kpi/library', '/kpi/manage', '/kpi/library/new', '/kpi/library/edit/:id', '/kpi/assign/:employeeId', '/kpi/team', '/kpi/org-history'].includes(r.path)).map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Manager & Admin/HR KPI Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "HR"]} />}>
              {kpiRoutes.filter(r => ['/kpi/team', '/kpi/manage', '/kpi/assign/:employeeId', '/kpi/org-history'].includes(r.path)).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              {adminRoutes.filter(r => r.path === '/employees/:id/profile').map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              {/* Manager & Mentor Operations Hub (M-01 to M-12) */}
              {managerRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>

            {/* HR/Admin Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "HR"]} />}>
              {/* Shared HR + Admin routes (employees, departments, org, etc.) */}
              {adminRoutes.filter(r => !['/roles', '/permissions', '/permissions/matrix', '/permissions/assign', '/superadmin', '/superadmin/roles-permissions', '/superadmin/notifications', '/employees/:id/profile'].includes(r.path)).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* ADMIN-only routes — Roles & Permissions management */}
              <Route element={<ProtectedRoute requiredPermissions={["PERMISSION_MANAGE"]} />}>
                {adminRoutes.filter(r => ['/roles', '/permissions', '/permissions/matrix', '/permissions/assign', '/superadmin/roles-permissions'].includes(r.path)).map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>

              {/* PIP Creation Route (Restricted) */}
              {pipRoutes.filter(r => r.adminOnly).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* IDP Creation Route (HR/Admin only) */}
              {idpRoutes.filter(r => r.path === "/idp/new").map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}

              {/* KPI Administrative Routes (Library Management) */}
              {kpiRoutes.filter(r => ['/kpi/library', '/kpi/library/new', '/kpi/library/edit/:id'].includes(r.path)).map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route path="/kpi/categories" element={<KpiCategoryManager />} />
            </Route>

            {/* System Admin record inventory and Super Admin hub */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/records" element={<SystemRecordsPage />} />
              <Route path="/superadmin" element={<SuperAdminModule />} />
              <Route path="/superadmin/notifications" element={<SuperadminNotificationPage />} />
            </Route>

            {/* Approvals — requires calibrate permission */}
            <Route element={<ProtectedRoute requiredPermissions={["APPRAISAL_CALIBRATE"]} />}>
              <Route path="/approvals" element={<ApprovalPage />} />
            </Route>

            {/* Audit Log Console */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "AUDIT_VIEWER"]} />}>
              <Route path="/audit-logs" element={<AuditLogPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<div className="p-6 text-center mt-20 font-bold text-gray-400">404 | Page Not Found</div>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </BrowserRouter>
  );
};

export default App;
