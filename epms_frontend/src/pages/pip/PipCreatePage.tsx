import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCreatePipMutation, useCreateObjectiveMutation, useActivatePipMutation } from '../../services/pipApi';
import { useGetEmployeesQuery, useGetManagerQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useAuth } from '../../hooks/useAuth';
import { PipSeverity } from '../../features/pip/types';
import type { PipCreateRequest } from '../../features/pip/types';
import React from 'react';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { CustomDateInput } from '../../components/common/CustomDateInput';

interface LocalObjective {
  title: string;
  description: string;
  successCriteria: string;
  targetDate: string;
}

const STEP_DEFS = [
  { id: 1, title: 'Identification', sub: 'Employee & Core Issue' },
  { id: 2, title: 'Logistics', sub: 'Timeline & Resources' },
  { id: 3, title: 'Framework', sub: 'Improvement Objectives' },
  { id: 4, title: 'Governance', sub: 'Follow-up Schedule' },
];

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  STANDARD: { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
  URGENT: { bg: '#FCEBEB', text: '#791F1F', border: '#F5BFBF' },
  CRITICAL: { bg: '#FCEBEB', text: '#791F1F', border: '#F5BFBF' },
};

const inputStyle: React.CSSProperties = {
  background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
  padding: '8px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
};

const PipCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const [createPip, { isLoading: isCreating }] = useCreatePipMutation();
  const [createObjective] = useCreateObjectiveMutation();
  const [activatePip, { isLoading: isActivating }] = useActivatePipMutation();

  const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery();
  const { data: employeeData, isLoading: isEmployeesLoading } = useGetEmployeesQuery({ page: 0, size: 1000 });
  const employees = employeeData?.content;

  const [activeStep, setActiveStep] = useState(1);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stepId = parseInt(entry.target.id.replace('step-', ''));
          setActiveStep(stepId);
        }
      });
    }, { threshold: 0.3, rootMargin: '-10% 0px -40% 0px' });
    setTimeout(() => {
      [1, 2, 3, 4].forEach(id => { const el = document.getElementById(`step-${id}`); if (el) observer.observe(el); });
    }, 100);
    return () => observer.disconnect();
  }, [departments, employees]);

  const scrollToStep = (id: number) => {
    setActiveStep(id);
    const el = document.getElementById(`step-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'smooth' });
  };

  const [formData, setFormData] = useState<PipCreateRequest>({
    employeeId: 0, startDate: '', endDate: '',
    severity: PipSeverity.STANDARD, reason: '', scheduledReviewDates: []
  });
  const [objectives, setObjectives] = useState<LocalObjective[]>([
    { title: '', description: '', successCriteria: '', targetDate: '' }
  ]);
  const [error, setError] = useState<string | null>(null);

  const submitForm = async (isDraft: boolean) => {
    setError(null);
    if (!formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason) {
      setError('Please complete all required fields: Employee, Dates, Reason.');
      scrollToStep(1); return;
    }
    if (!directManager) {
      setError('Cannot create PIP — this employee has no active reporting line. Set the reporting line first.');
      scrollToStep(1); return;
    }
    if (objectives.length === 0) { setError('Please add at least one improvement objective.'); scrollToStep(3); return; }
    try {
      const pipResponse = await createPip(formData).unwrap();
      const newPipId = pipResponse.data.pipId;
      await Promise.all(objectives.map(obj => createObjective({ ...obj, pipId: newPipId, targetDate: obj.targetDate || formData.endDate }).unwrap()));
      if (!isDraft) await activatePip(newPipId).unwrap();
      navigate('/pip');
    } catch (err: any) {
      setError('Failed to process PIP. Please check your inputs.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: name.includes('Id') ? parseInt(value) : value };
      if (name === 'startDate' && newData.endDate && new Date(value) > new Date(newData.endDate)) newData.endDate = '';
      return newData;
    });
  };

  const handleDurationClick = (days: number) => {
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const end = new Date(start); end.setDate(end.getDate() + days);
    setFormData(prev => ({ ...prev, startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] }));
  };

  const durationDiff = formData.startDate && formData.endDate
    ? Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const addReviewDate = () => setFormData(prev => ({ ...prev, scheduledReviewDates: [...(prev.scheduledReviewDates || []), ''] }));
  const removeReviewDate = (i: number) => setFormData(prev => ({ ...prev, scheduledReviewDates: (prev.scheduledReviewDates || []).filter((_, idx) => idx !== i) }));
  const handleReviewDateChange = (i: number, v: string) => setFormData(prev => { const d = [...(prev.scheduledReviewDates || [])]; d[i] = v; return { ...prev, scheduledReviewDates: d }; });

  const handleObjectiveChange = (i: number, field: keyof LocalObjective, value: string) => {
    const n = [...objectives]; n[i] = { ...n[i], [field]: value }; setObjectives(n);
  };
  const addObjective = () => setObjectives([...objectives, { title: '', description: '', successCriteria: '', targetDate: '' }]);
  const removeObjective = (i: number) => setObjectives(objectives.filter((_, idx) => idx !== i));

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartmentId(parseInt(e.target.value));
    setFormData(prev => ({ ...prev, employeeId: 0 }));
  };

  const filteredEmployees = useMemo(() => !employees ? [] : employees.filter(emp => selectedDepartmentId === 0 || emp.currentDepartmentId === selectedDepartmentId), [employees, selectedDepartmentId]);

  // Auto-resolve direct manager from reporting line when employee is selected
  const { data: directManager, isFetching: isResolvingManager } = useGetManagerQuery(
    formData.employeeId,
    { skip: !formData.employeeId || formData.employeeId === 0 }
  );
  const canSubmit = !!directManager;

  if (isEmployeesLoading || isDepartmentsLoading) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading data…</div>
  );

  return (
    <div className="space-y-4 pb-8">
      <button onClick={() => navigate('/pip')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5A6070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        className="hover:text-[#111827] transition-colors">
        <ChevronLeft size={14} /> Return to Active Plans
      </button>

      <div style={{ paddingBottom: 14, borderBottom: '0.5px solid #E4E6EC' }}>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Create Performance Improvement Plan</h1>
        <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2, maxWidth: 560 }}>
          Establish a clear, supportive framework for employee growth. Define objectives, timelines, and measurable success criteria.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Sidebar stepper - hidden on mobile */}
        <aside className="hidden lg:block" style={{ width: 180, flexShrink: 0 }}>
          <nav style={{ position: 'sticky', top: 40 }} className="space-y-4">
            {STEP_DEFS.map(step => (
              <div key={step.id} className="flex gap-3 items-start cursor-pointer" onClick={() => scrollToStep(step.id)}>
                <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 12, flexShrink: 0, background: activeStep === step.id ? '#1A56DB' : '#F5F6F8', color: activeStep === step.id ? '#FFFFFF' : '#9EA3B0', border: activeStep === step.id ? 'none' : '0.5px solid #E0E2E8', transition: 'all 0.2s' }}>
                  {step.id}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: activeStep === step.id ? '#1A56DB' : '#9EA3B0' }}>{step.title}</p>
                  <p style={{ fontSize: 11, color: activeStep === step.id ? '#111827' : '#9EA3B0' }}>{step.sub}</p>
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-4">
          {error && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #F5BFBF', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#791F1F', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠ {error}
            </div>
          )}

          {/* Section 1: Identification */}
          <section id="step-1" style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 18, background: '#1A56DB', borderRadius: 2 }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Employee Selection & Core Issue</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label style={labelStyle}>Department</label>
                <select style={inputStyle} value={selectedDepartmentId} onChange={handleDepartmentChange}>
                  <option value={0}>Select a department…</option>
                  {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Target Employee</label>
                <select style={inputStyle} name="employeeId" value={formData.employeeId} onChange={handleChange}>
                  <option value={0}>Select an employee…</option>
                  {filteredEmployees?.map(emp => <option key={emp.id} value={emp.id}>{emp.staffName}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Direct Manager (auto-resolved)</label>
                <div style={{ ...inputStyle, background: '#F0F2F6', color: directManager ? '#111827' : '#9EA3B0', cursor: 'not-allowed', display: 'flex', alignItems: 'center', minHeight: 36 }}>
                  {!formData.employeeId || formData.employeeId === 0
                    ? 'Pick an employee first…'
                    : isResolvingManager
                      ? 'Resolving…'
                      : directManager
                        ? `${directManager.staffName}${directManager.employeeCode && directManager.employeeCode !== 'null' ? ` (${directManager.employeeCode})` : ''}`
                        : '⚠ No active reporting line — set one before creating a PIP'}
                </div>
                {formData.employeeId > 0 && !isResolvingManager && !directManager && (
                  <p style={{ fontSize: 11, color: '#791F1F', marginTop: 4 }}>Cannot create PIP until a reporting line is assigned for this employee.</p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Severity Level</label>
                <div className="flex gap-2">
                  {(Object.keys(PipSeverity) as Array<keyof typeof PipSeverity>).map(key => {
                    const level = PipSeverity[key];
                    const isSelected = formData.severity === level;
                    const ss = SEVERITY_STYLE[level] || SEVERITY_STYLE.STANDARD;
                    return (
                      <button key={level} type="button" onClick={() => setFormData(prev => ({ ...prev, severity: level }))}
                        style={{ flex: 1, padding: '7px 8px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: isSelected ? ss.bg : '#F5F6F8', color: isSelected ? ss.text : '#9EA3B0', border: `0.5px solid ${isSelected ? ss.border : '#E0E2E8'}`, cursor: 'pointer' }}>
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label style={labelStyle}>Reason for Plan (Core Performance Issues)</label>
                <textarea name="reason" value={formData.reason} onChange={handleChange} rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Provide a detailed, objective description of the performance gap. Reference specific examples or missed targets." />
              </div>
            </div>
          </section>

          {/* Section 2: Timeline */}
          <section id="step-2" style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 18, background: '#1A56DB', borderRadius: 2 }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Timeline & Support</p>
            </div>
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Duration Presets</label>
                <div className="flex gap-3">
                  {[30, 60].map(days => (
                    <button key={days} type="button" onClick={() => handleDurationClick(days)}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: `0.5px solid ${durationDiff === days ? '#1A56DB' : '#E0E2E8'}`, background: durationDiff === days ? '#EEF3FD' : '#F5F6F8', textAlign: 'left', cursor: 'pointer' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: durationDiff === days ? '#1A56DB' : '#111827' }}>{days} Days</p>
                      <p style={{ fontSize: 11, color: durationDiff === days ? '#0C447C' : '#9EA3B0' }}>{days === 30 ? 'Accelerated Review' : 'Standard Duration'}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <CustomDateInput style={inputStyle} value={formData.startDate} onChange={val => { setFormData(prev => { const newData = { ...prev, startDate: val }; if (newData.endDate && new Date(val) > new Date(newData.endDate)) newData.endDate = ''; return newData; }); }} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <CustomDateInput style={inputStyle} value={formData.endDate} min={formData.startDate || undefined} onChange={val => setFormData(prev => ({ ...prev, endDate: val }))} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Objectives */}
          <section id="step-3" style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
            <div className="flex justify-between items-center" style={{ padding: '12px 16px', borderBottom: '0.5px solid #E4E6EC', background: '#FAFBFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 18, background: '#1A56DB', borderRadius: 2 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Improvement Objectives</p>
              </div>
              <button type="button" onClick={addObjective}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                <Plus size={12} /> Add Objective
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 560 }}>
                <thead>
                  <tr style={{ background: '#FAFBFF', borderBottom: '0.5px solid #E4E6EC' }}>
                    {['Objective & Description', 'Success Criteria (KPI)', 'Target Date', ''].map((h, i) => (
                      <th key={i} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {objectives.map((obj, i) => (
                    <tr key={i} style={{ borderBottom: i < objectives.length - 1 ? '0.5px solid #F0F2F6' : 'none' }} className="hover:bg-[#FAFBFF] transition-colors">
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', minWidth: 180 }}>
                        <input type="text" value={obj.title} onChange={e => handleObjectiveChange(i, 'title', e.target.value)}
                          placeholder="Objective Title"
                          style={{ background: 'transparent', border: 'none', borderBottom: '0.5px solid #E0E2E8', padding: '0 0 4px', fontSize: 13, fontWeight: 500, color: '#111827', outline: 'none', width: '100%', marginBottom: 6 }} />
                        <textarea value={obj.description} onChange={e => handleObjectiveChange(i, 'description', e.target.value)}
                          placeholder="Describe the expectation…" rows={2}
                          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, color: '#5A6070', outline: 'none', width: '100%', resize: 'none' }} />
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', minWidth: 180 }}>
                        <textarea value={obj.successCriteria} onChange={e => handleObjectiveChange(i, 'successCriteria', e.target.value)}
                          placeholder="Measurable KPI (e.g. Reduce bugs by 20%)" rows={3}
                          style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: '#5A6070', outline: 'none', width: '100%', resize: 'none' }} />
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', minWidth: 140 }}>
                        <CustomDateInput value={obj.targetDate} min={formData.startDate || undefined} max={formData.endDate || undefined}
                          onChange={val => handleObjectiveChange(i, 'targetDate', val)}
                          style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', width: '100%' }} />
                        {!obj.targetDate && formData.endDate && (
                          <p style={{ fontSize: 10, color: '#9EA3B0', marginTop: 4 }}>Defaults to end date</p>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'center' }}>
                        {objectives.length > 1 && (
                          <button type="button" onClick={() => removeObjective(i)}
                            style={{ background: 'none', border: 'none', color: '#E0E2E8', cursor: 'pointer', padding: 4 }}
                            className="hover:text-[#791F1F] transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: Follow-up */}
          <section id="step-4" style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 3, height: 18, background: '#1A56DB', borderRadius: 2 }} />
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Follow-up Schedule</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(formData.scheduledReviewDates || []).map((date, i) => (
                <div key={i} style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '12px 14px' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 500, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-in #{i + 1}</p>
                    <button type="button" onClick={() => removeReviewDate(i)}
                      style={{ background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', padding: 2 }}
                      className="hover:text-[#791F1F] transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <CustomDateInput value={date} min={formData.startDate || undefined} max={formData.endDate || undefined}
                    onChange={val => handleReviewDateChange(i, val)}
                    style={{ background: '#FFFFFF', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '6px 10px', fontSize: 12, outline: 'none', width: '100%' }} />
                  <p style={{ fontSize: 10, color: '#9EA3B0', marginTop: 6 }}>Planned status review</p>
                </div>
              ))}
              <button type="button" onClick={addReviewDate}
                style={{ border: '0.5px dashed #B5D4F4', borderRadius: 8, padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#EEF3FD', cursor: 'pointer' }}
                className="hover:bg-[#D6E8F9] transition-colors">
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={14} style={{ color: '#FFFFFF' }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Add Review Date</p>
              </button>
            </div>
          </section>

          {/* Footer actions */}
          <div className="flex flex-wrap justify-between items-center gap-3" style={{ paddingTop: 12, borderTop: '0.5px solid #E4E6EC' }}>
            <button type="button" onClick={() => navigate('/pip')}
              style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
              className="hover:bg-[#E0E2E8] transition-colors">
              Discard Draft
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => submitForm(true)} disabled={isCreating || isActivating || !canSubmit}
                style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500 }}
                className="disabled:opacity-50 hover:bg-[#E0E2E8] transition-colors">
                {isCreating && !isActivating ? 'Saving…' : 'Save Draft'}
              </button>
              <button type="button" onClick={() => submitForm(false)} disabled={isCreating || isActivating || !canSubmit}
                style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 500 }}
                className="disabled:opacity-50 hover:opacity-90 transition-opacity">
                {isActivating ? 'Activating…' : 'Activate Performance Plan'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PipCreatePage;
