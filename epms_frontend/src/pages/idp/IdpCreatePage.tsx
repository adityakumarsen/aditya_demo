import { useMemo, useState } from "react";
import type React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CalendarDays, ChevronLeft, CheckCircle2, GraduationCap, Plus, Trash2, UserCheck } from "lucide-react";
import { useGetAllEmployeesQuery, useGetManagerQuery } from "../../features/employee/employeeapi";
import { useGetActiveDepartmentsQuery } from "../../features/org/departmentApi";
import { useCreateIdpMutation } from "../../services/idpApi";
import { useAuth } from "../../hooks/useAuth";

const inputStyle: React.CSSProperties = {
  background: "#F5F6F8",
  border: "0.5px solid #E0E2E8",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  color: "#111827",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: "#9EA3B0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 5,
};

const panelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E4E6EC",
  borderRadius: 12,
  padding: "16px 18px",
};

const IdpCreatePage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: employees = [] } = useGetAllEmployeesQuery();
  const { data: departments = [] } = useGetActiveDepartmentsQuery();
  const [createIdp, { isLoading }] = useCreateIdpMutation();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);
  const [formData, setFormData] = useState({
    employeeId: "",
    title: "",
    summary: "",
    startDate: "",
    endDate: "",
    scheduledFollowUpDates: [] as string[],
  });

  const selectedEmployee = employees.find(employee => employee.id === Number(formData.employeeId));
  const filteredEmployees = useMemo(
    () => employees.filter(employee => selectedDepartmentId === 0 || employee.currentDepartmentId === selectedDepartmentId),
    [employees, selectedDepartmentId],
  );
  const { data: directManager, isFetching: isResolvingManager } = useGetManagerQuery(
    Number(formData.employeeId),
    { skip: !formData.employeeId },
  );

  const setDuration = (months: number) => {
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    end.setDate(end.getDate() - 1);
    setFormData(prev => ({
      ...prev,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    }));
  };

  const addFollowUpDate = () => {
    setFormData(prev => ({ ...prev, scheduledFollowUpDates: [...prev.scheduledFollowUpDates, ""] }));
  };

  const removeFollowUpDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      scheduledFollowUpDates: prev.scheduledFollowUpDates.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const updateFollowUpDate = (index: number, value: string) => {
    setFormData(prev => {
      const dates = [...prev.scheduledFollowUpDates];
      dates[index] = value;
      return { ...prev, scheduledFollowUpDates: dates };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.employeeId || !formData.title || !formData.startDate || !formData.endDate) {
      toast.warning("Please fill all required fields.");
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.warning("End date cannot be before start date.");
      return;
    }
    const hasOutOfRangeFollowUp = formData.scheduledFollowUpDates
      .filter(Boolean)
      .some(date => new Date(date) < new Date(formData.startDate) || new Date(date) > new Date(formData.endDate));
    if (hasOutOfRangeFollowUp) {
      toast.warning("Follow-up dates must be within the IDP timeline.");
      return;
    }
    if (!directManager) {
      toast.warning("This employee has no active reporting line. Set the direct manager first.");
      return;
    }

    try {
      const response = await createIdp({
        employeeId: Number(formData.employeeId),
        title: formData.title,
        summary: formData.summary,
        startDate: formData.startDate,
        endDate: formData.endDate,
        scheduledFollowUpDates: formData.scheduledFollowUpDates.filter(Boolean),
      }).unwrap();
      toast.success("Development plan created.");
      navigate(`/idp/${response.data.idpId}`);
    } catch (err: any) {
      toast.error("Could not create development plan.");
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid #E4E6EC", borderRadius: 8, background: "#FFFFFF", color: "#5A6070" }}>
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>Create Development Plan</h1>
          <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 1 }}>Set a growth plan for an employee.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={panelStyle} className="max-w-4xl space-y-4">
        <div className="flex items-start gap-3" style={{ marginBottom: 4 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={17} style={{ color: "#27500A" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Growth Plan Details</p>
            <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>
              IDP is for capability growth, future readiness, mentoring, and career development.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Department</label>
            <select
              style={inputStyle}
              value={selectedDepartmentId}
              onChange={event => {
                setSelectedDepartmentId(Number(event.target.value));
                setFormData(prev => ({ ...prev, employeeId: "" }));
              }}
            >
              <option value={0}>All departments</option>
              {departments.map(department => (
                <option key={department.id} value={department.id}>{department.departmentName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Employee</label>
            <select style={inputStyle} value={formData.employeeId} onChange={event => setFormData({ ...formData, employeeId: event.target.value })} required>
              <option value="">Select employee</option>
              {filteredEmployees.map(employee => (
                <option key={employee.id} value={employee.id}>{employee.staffName}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ background: "#F8FBF4", border: "0.5px solid #D7E9C6", borderRadius: 8, padding: "12px 14px" }}>
          <div className="flex items-start gap-3">
            <UserCheck size={16} style={{ color: "#27500A", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#27500A" }}>Direct Manager</p>
              <p style={{ fontSize: 13, color: "#111827", marginTop: 3 }}>
                {!formData.employeeId
                  ? "Select an employee first."
                  : isResolvingManager
                    ? "Resolving manager..."
                    : directManager
                      ? `${directManager.staffName}${directManager.employeeCode && directManager.employeeCode !== 'null' ? ` (${directManager.employeeCode})` : ''}`
                      : selectedEmployee?.directManagerName || "No active reporting line found."}
              </p>
              <p style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>
                The manager is not manually selectable for IDP creation, so ownership follows the official reporting structure.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Development Focus</label>
          <input style={inputStyle} value={formData.title} onChange={event => setFormData({ ...formData, title: event.target.value })} placeholder="e.g. Prepare for Team Lead Role" required />
        </div>

        <div>
          <label style={labelStyle}>Growth Summary</label>
          <textarea
            style={{ ...inputStyle, minHeight: 96 }}
            value={formData.summary}
            onChange={event => setFormData({ ...formData, summary: event.target.value })}
            placeholder="Describe the career growth, capability gap, mentoring focus, or readiness goal this plan supports."
          />
        </div>

        <div style={{ background: "#FAFBFF", border: "0.5px solid #D9E5FF", borderRadius: 12, padding: "14px 16px" }}>
          <div className="flex items-start gap-3" style={{ marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#EEF3FD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CalendarDays size={16} style={{ color: "#1A56DB" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Timeline & Support</p>
              <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>
                Set a realistic growth window and schedule coaching check-ins for follow-up support.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Duration Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {[3, 6].map(months => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setDuration(months)}
                    style={{ border: "0.5px solid #BFD0F8", borderRadius: 8, background: "#FFFFFF", padding: "10px 12px", textAlign: "left" }}
                  >
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#1A56DB" }}>{months} Months</p>
                    <p style={{ fontSize: 11, color: "#9EA3B0", marginTop: 2 }}>{months === 3 ? "Focused skill sprint" : "Standard growth cycle"}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" style={inputStyle} value={formData.startDate} onChange={event => setFormData({ ...formData, startDate: event.target.value })} required />
              </div>
              <div>
                <label style={labelStyle}>Target Completion Date</label>
                <input type="date" style={inputStyle} value={formData.endDate} min={formData.startDate} onChange={event => setFormData({ ...formData, endDate: event.target.value })} required />
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "14px 16px" }}>
          <div className="flex items-center justify-between gap-3" style={{ marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Follow-up Schedule</p>
              <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>Optional coaching dates for manager and employee check-ins.</p>
            </div>
            <button type="button" onClick={addFollowUpDate} className="inline-flex items-center gap-2" style={{ border: "none", background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "7px 11px", fontSize: 12 }}>
              <Plus size={13} /> Add Date
            </button>
          </div>
          {formData.scheduledFollowUpDates.length === 0 ? (
            <div style={{ border: "0.5px dashed #BFD0F8", background: "#FAFBFF", borderRadius: 8, padding: "16px", textAlign: "center", fontSize: 12, color: "#9EA3B0" }}>
              No follow-up dates added yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {formData.scheduledFollowUpDates.map((date, index) => (
                <div key={index} style={{ background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8, padding: "10px 12px" }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "#1A56DB", textTransform: "uppercase" }}>Check-in #{index + 1}</p>
                    <button type="button" onClick={() => removeFollowUpDate(index)} style={{ border: "none", background: "transparent", color: "#9EA3B0", padding: 2 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input type="date" style={{ ...inputStyle, background: "#FFFFFF" }} min={formData.startDate} max={formData.endDate} value={date} onChange={event => updateFollowUpDate(index, event.target.value)} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} style={{ border: "0.5px solid #E4E6EC", background: "#FFFFFF", color: "#5A6070", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>Cancel</button>
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2" style={{ border: "none", background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13, opacity: isLoading ? 0.7 : 1 }}>
            <CheckCircle2 size={14} /> {isLoading ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IdpCreatePage;
