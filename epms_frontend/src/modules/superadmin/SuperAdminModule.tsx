import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, FileClock, BarChart3, Settings2, Lock, Bell } from "lucide-react";

export const SuperAdminModule = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={28} />
            Super Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global governance, system audit logs, user security permissions, and enterprise controls.
          </p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 font-bold text-xs uppercase px-3 py-1 rounded-full border border-indigo-200">
          Super Admin Scope
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/employees" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group">
          <Users className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">Employee Directory & Access</h3>
          <p className="text-xs text-slate-500 mt-1">Manage all 80+ employees, lock/unlock accounts, assign roles.</p>
        </Link>

        <Link to="/audit-logs" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group">
          <FileClock className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">System Audit Trails</h3>
          <p className="text-xs text-slate-500 mt-1">Immutable administrative action logs with IP addresses and timestamps.</p>
        </Link>

        <Link to="/superadmin/roles-permissions" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group">
          <Settings2 className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">Role & Permission Management</h3>
          <p className="text-xs text-slate-500 mt-1">Assign user roles, configure granular RBAC permission matrices, and manage access policies.</p>
        </Link>

        <Link to="/superadmin/notifications" className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group">
          <Bell className="text-indigo-600 mb-3" size={24} />
          <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">Announcement Hub</h3>
          <p className="text-xs text-slate-500 mt-1">Broadcast targeted announcements to Everyone, HR, Mentors, Interns, or specific users with scheduling.</p>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminModule;
