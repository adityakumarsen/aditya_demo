import { useState } from "react";
import type React from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ChevronLeft, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import EditIdpModal from "../../components/idp/EditIdpModal";
import GoalModal from "../../components/idp/GoalModal";
import GoalProgressList from "../../components/idp/GoalProgressList";
import GoalStatusBadge from "../../components/idp/GoalStatusBadge";
import IdpStatusBadge from "../../components/idp/IdpStatusBadge";
import ProgressUpdateModal from "../../components/idp/ProgressUpdateModal";
import { DevelopmentGoalStatus, IdpStatus } from "../../features/idp/idpTypes";
import type { DevelopmentGoalResponse, IdpUpdateRequest } from "../../features/idp/idpTypes";
import { useAuth } from "../../hooks/useAuth";
import {
  useActivateIdpMutation,
  useAddIdpProgressMutation,
  useCancelIdpMutation,
  useCompleteIdpMutation,
  useCreateGoalMutation,
  useDeleteIdpMutation,
  useDeleteGoalMutation,
  useGetGoalsByIdpQuery,
  useGetIdpByIdQuery,
  useUpdateGoalMutation,
  useUpdateIdpMutation,
} from "../../services/idpApi";

const panelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E4E6EC",
  borderRadius: 12,
  padding: "16px 18px",
};

const IdpDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const idpId = Number(id);
  const { user, isAdmin, isHR } = useAuth();

  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DevelopmentGoalResponse | null>(null);
  const [progressGoal, setProgressGoal] = useState<DevelopmentGoalResponse | null>(null);

  const { data: planResponse, isLoading: isPlanLoading, refetch: refetchPlan } = useGetIdpByIdQuery(idpId, { skip: !idpId });
  const { data: goalResponse, isLoading: isGoalsLoading, refetch: refetchGoals } = useGetGoalsByIdpQuery(idpId, { skip: !idpId });
  const [activateIdp] = useActivateIdpMutation();
  const [completeIdp] = useCompleteIdpMutation();
  const [cancelIdp] = useCancelIdpMutation();
  const [createGoal] = useCreateGoalMutation();
  const [addProgress] = useAddIdpProgressMutation();
  const [updateIdp] = useUpdateIdpMutation();
  const [deleteIdp] = useDeleteIdpMutation();
  const [updateGoal] = useUpdateGoalMutation();
  const [deleteGoal] = useDeleteGoalMutation();

  const plan = planResponse?.data;
  const goals = goalResponse?.data ?? [];
  const canDelete = !!plan && (isAdmin || isHR) && plan.status === IdpStatus.DRAFT;
  const canManage = !!plan && (isAdmin || isHR || plan.managerId === user?.id);
  const isTargetEmployee = !!plan && plan.employeeId === user?.id;

  const refresh = async () => {
    await Promise.all([refetchPlan(), refetchGoals()]);
  };

  const runStatusAction = async (action: "activate" | "complete" | "cancel") => {
    if (action === "complete" && !window.confirm("Complete this IDP? The plan will no longer be editable.")) return;
    if (action === "cancel" && !window.confirm("Cancel this IDP? This will stop further progress tracking.")) return;
    try {
      if (action === "activate") await activateIdp(idpId).unwrap();
      if (action === "complete") await completeIdp(idpId).unwrap();
      if (action === "cancel") await cancelIdp(idpId).unwrap();
      toast.success("Development plan updated.");
      await refresh();
    } catch (err: any) {
      toast.error("Could not update development plan.");
    }
  };

  const handleSaveEdit = async (data: IdpUpdateRequest) => {
    try {
      await updateIdp({ id: idpId, body: data }).unwrap();
      toast.success("Development plan updated.");
      await refresh();
    } catch (err: any) {
      toast.error("Could not update development plan.");
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this draft IDP? This action cannot be undone.")) return;
    try {
      await deleteIdp(idpId).unwrap();
      toast.success("Development plan deleted.");
      navigate("/idp");
    } catch (err: any) {
      toast.error("Could not delete development plan.");
    }
  };

  const handleDeleteGoal = async (goal: DevelopmentGoalResponse) => {
    if (!window.confirm(`Delete the goal "${goal.title}"? This action cannot be undone.`)) return;
    try {
      await deleteGoal(goal.goalId).unwrap();
      toast.success("Development goal deleted.");
      await refresh();
    } catch (err: any) {
      toast.error("Could not delete development goal.");
    }
  };

  if (isPlanLoading || !plan) {
    return <div style={panelStyle}><p style={{ fontSize: 13, color: "#9EA3B0" }}>Loading development plan...</p></div>;
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid #E4E6EC", borderRadius: 8, background: "#FFFFFF", color: "#5A6070" }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>{plan.title}</h1>
              <IdpStatusBadge status={plan.status} />
            </div>
            <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>{plan.employeeName} · Manager: {plan.managerName}</p>
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            {plan.status !== IdpStatus.COMPLETED && plan.status !== IdpStatus.CANCELLED && (
              <button onClick={() => setShowEditModal(true)} className="inline-flex items-center gap-2" style={{ border: "0.5px solid #E4E6EC", background: "#FFFFFF", color: "#1A56DB", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
                <Pencil size={13} /> Edit
              </button>
            )}
            {plan.status === IdpStatus.DRAFT && (
              <button onClick={() => runStatusAction("activate")} style={{ border: "none", background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>Activate</button>
            )}
            {plan.status === IdpStatus.ACTIVE && (
              <>
                <button onClick={() => runStatusAction("complete")} style={{ border: "none", background: "#27500A", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>Complete</button>
                <button onClick={() => runStatusAction("cancel")} style={{ border: "0.5px solid #F5C2C2", background: "#FCEBEB", color: "#791F1F", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>Cancel</button>
              </>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="inline-flex items-center gap-2" style={{ border: "0.5px solid #F5C2C2", background: "#FCEBEB", color: "#791F1F", borderRadius: 8, padding: "8px 14px", fontSize: 13 }}>
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p style={{ fontSize: 11, color: "#9EA3B0", textTransform: "uppercase" }}>Progress</p>
            <p style={{ fontSize: 22, fontWeight: 500, color: "#111827" }}>{plan.overallProgress}%</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#9EA3B0", textTransform: "uppercase" }}>Goals</p>
            <p style={{ fontSize: 22, fontWeight: 500, color: "#111827" }}>{plan.completedGoalCount}/{plan.goalCount}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#9EA3B0", textTransform: "uppercase" }}>Start</p>
            <p style={{ fontSize: 13, color: "#111827" }}>{plan.startDate}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "#9EA3B0", textTransform: "uppercase" }}>End</p>
            <p style={{ fontSize: 13, color: "#111827" }}>{plan.endDate}</p>
          </div>
        </div>
        {plan.summary && <p style={{ fontSize: 13, color: "#5A6070", marginTop: 14 }}>{plan.summary}</p>}
        {plan.scheduledFollowUpDates && plan.scheduledFollowUpDates.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: "#9EA3B0", textTransform: "uppercase", marginBottom: 8 }}>Follow-up Schedule</p>
            <div className="flex flex-wrap gap-2">
              {plan.scheduledFollowUpDates.map((date, index) => (
                <span key={`${date}-${index}`} style={{ border: "0.5px solid #BFD0F8", background: "#EEF3FD", color: "#1A56DB", borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>
                  Check-in {index + 1}: {date}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ height: 7, background: "#F0F2F6", borderRadius: 999, marginTop: 14 }}>
          <div style={{ height: "100%", width: `${plan.overallProgress}%`, background: "#1A56DB", borderRadius: 999 }} />
        </div>
      </div>

      <div style={panelStyle}>
        <div className="flex items-center justify-between gap-3" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>Development Goals</h2>
            <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>Track concrete growth actions for this plan.</p>
          </div>
          {canManage && plan.status !== IdpStatus.COMPLETED && plan.status !== IdpStatus.CANCELLED && (
            <button onClick={() => setShowGoalModal(true)} className="inline-flex items-center gap-2" style={{ border: "none", background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
              <Plus size={14} /> Add Goal
            </button>
          )}
        </div>

        {isGoalsLoading ? (
          <p style={{ fontSize: 13, color: "#9EA3B0" }}>Loading goals...</p>
        ) : goals.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9EA3B0" }}>No goals added yet.</p>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <div key={goal.goalId} style={{ border: "0.5px solid #E4E6EC", borderRadius: 8, padding: 14 }}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{goal.title}</h3>
                      <GoalStatusBadge status={goal.status} />
                    </div>
                    <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 3 }}>{goal.category.replaceAll("_", " ")} · Target {goal.targetDate}</p>
                    {goal.description && <p style={{ fontSize: 13, color: "#5A6070", marginTop: 8 }}>{goal.description}</p>}
                    {goal.successCriteria && <p style={{ fontSize: 12, color: "#5A6070", marginTop: 6 }}>Success: {goal.successCriteria}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canManage && goal.status === DevelopmentGoalStatus.NOT_STARTED && plan.status !== IdpStatus.COMPLETED && plan.status !== IdpStatus.CANCELLED && (
                      <>
                        <button onClick={() => setEditingGoal(goal)} className="inline-flex items-center gap-2" style={{ border: "0.5px solid #E4E6EC", background: "#FFFFFF", color: "#1A56DB", borderRadius: 8, padding: "7px 11px", fontSize: 12 }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button onClick={() => handleDeleteGoal(goal)} className="inline-flex items-center gap-2" style={{ border: "0.5px solid #F5C2C2", background: "#FCEBEB", color: "#791F1F", borderRadius: 8, padding: "7px 11px", fontSize: 12 }}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </>
                    )}
                    {isTargetEmployee && plan.status === IdpStatus.ACTIVE && (
                      <button onClick={() => setProgressGoal(goal)} className="inline-flex items-center gap-2" style={{ border: "0.5px solid #E4E6EC", background: "#FFFFFF", color: "#1A56DB", borderRadius: 8, padding: "7px 11px", fontSize: 12 }}>
                        <RotateCcw size={13} /> Update
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: "#5A6070" }}>Progress</span>
                    <span style={{ fontSize: 12, color: "#111827" }}>{goal.progressPercent}%</span>
                  </div>
                  <div style={{ height: 5, background: "#F0F2F6", borderRadius: 999, marginTop: 5 }}>
                    <div style={{ height: "100%", width: `${goal.progressPercent}%`, background: "#1A56DB", borderRadius: 999 }} />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <GoalProgressList goalId={goal.goalId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGoalModal && (
        <GoalModal
          onClose={() => setShowGoalModal(false)}
          onSubmit={async data => {
            await createGoal({ ...data, idpId }).unwrap();
            toast.success("Development goal added.");
            await refresh();
          }}
        />
      )}

      {editingGoal && (
        <GoalModal
          initialData={editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={async data => {
            await updateGoal({ id: editingGoal.goalId, body: data }).unwrap();
            toast.success("Development goal updated.");
            setEditingGoal(null);
            await refresh();
          }}
        />
      )}

      {showEditModal && (
        <EditIdpModal
          plan={plan}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {progressGoal && (
        <ProgressUpdateModal
          initialProgress={progressGoal.progressPercent}
          onClose={() => setProgressGoal(null)}
          onSubmit={async data => {
            const selectedGoalId = progressGoal.goalId ?? (progressGoal as unknown as { id?: number }).id;
            if (!selectedGoalId) {
              toast.error("Cannot update progress because the selected goal is missing its ID.");
              return;
            }
            await addProgress({ ...data, goalId: selectedGoalId }).unwrap();
            toast.success("Progress updated.");
            await refresh();
          }}
        />
      )}
    </div>
  );
};

export default IdpDetailsPage;
