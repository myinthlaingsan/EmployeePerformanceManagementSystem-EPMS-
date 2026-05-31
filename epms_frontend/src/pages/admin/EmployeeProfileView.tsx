import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { useGetEmployeeByIdQuery } from "../../features/employee/employeeapi";
import {
  useGetActiveCycleQuery,
  useGetAppraisalByEmployeeAndCycleQuery,
  useGetScoreBreakdownQuery,
} from "../../features/appraisal/appraisalApi";
import { useGetGoalSetByEmployeeQuery } from "../../services/kpiApi";
import { useGetPipsByEmployeeQuery } from "../../services/pipApi";
import { useGetIdpsByEmployeeQuery } from "../../services/idpApi";
import { PipStatus, type PipResponse } from "../../features/pip/types";
import { IdpStatus, type IdpResponse } from "../../features/idp/idpTypes";
import type { GoalItemResponse } from "../../features/kpi/kpiTypes";

type ProfileGoalItem = GoalItemResponse & {
  kpiName?: string;
  customKpiName?: string;
  weightage?: number;
};

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const skillColors = ["#1A56DB", "#639922", "#BA7517", "#9333EA", "#0369A1", "#E11D48"];

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E4E6EC",
  borderRadius: 12,
};

const mutedText = { color: "#9EA3B0" };

const formatDate = (date?: string) => {
  if (!date) return "Not set";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString();
};

const formatStatus = (status?: string) => status?.replaceAll("_", " ") ?? "Unknown";

const getProgress = (item: ProfileGoalItem) => {
  if (typeof item.currentProgress === "number") return item.currentProgress;
  if (typeof item.scorePercent === "number") return item.scorePercent;
  if (item.status === "COMPLETED") return 100;
  if (item.status === "IN_PROGRESS") return 50;
  return 0;
};

const statusPillStyle = (status?: string): React.CSSProperties => {
  if (status === "COMPLETED" || status === "ACTIVE") {
    return { background: "#EAF3DE", color: "#27500A", border: "0.5px solid #B8DCA0" };
  }
  if (status === "IN_PROGRESS" || status === "APPROVED") {
    return { background: "#EEF3FD", color: "#0C447C", border: "0.5px solid #C8CCE0" };
  }
  if (status === "CRITICAL" || status === "URGENT") {
    return { background: "#FCEBEB", color: "#791F1F", border: "0.5px solid #F5C2C2" };
  }
  return { background: "#FAEEDA", color: "#633806", border: "0.5px solid #F0D4A4" };
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="py-8 text-center">
    <AlertCircle size={22} className="mx-auto mb-2" style={mutedText} />
    <p style={{ fontSize: 12, color: "#9EA3B0" }}>{text}</p>
  </div>
);

const EmployeeProfileView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const employeeId = Number(id);

  const { data: employee, isLoading: isEmployeeLoading, error: employeeError } =
    useGetEmployeeByIdQuery(employeeId, { skip: !employeeId });
  const { data: activeCycle } = useGetActiveCycleQuery();
  const activeCycleId = activeCycle?.cycleId;

  const {
    data: appraisal,
    isLoading: isAppraisalLoading,
    error: appraisalError,
  } = useGetAppraisalByEmployeeAndCycleQuery(
    { employeeId, cycleId: activeCycleId ?? 0 },
    { skip: !employeeId || !activeCycleId },
  );
  const appraisalId = appraisal?.appraisalId ?? appraisal?.id;

  const { data: scoreBreakdown, isLoading: isScoreLoading } = useGetScoreBreakdownQuery(
    String(appraisalId),
    { skip: !appraisalId },
  );

  const { data: goalSetResp, isLoading: isGoalsLoading } = useGetGoalSetByEmployeeQuery(
    { employeeId, cycleId: activeCycleId ?? 0 },
    { skip: !employeeId || !activeCycleId },
  );
  const goalSet = goalSetResp?.data;
  const goalItems = useMemo<ProfileGoalItem[]>(
    () => goalSet?.kpiItems ?? goalSet?.items ?? [],
    [goalSet?.items, goalSet?.kpiItems],
  );

  const { data: pipsResp, isLoading: isPipsLoading } = useGetPipsByEmployeeQuery(employeeId, {
    skip: !employeeId,
  });
  const { data: idpsResp, isLoading: isIdpsLoading } = useGetIdpsByEmployeeQuery(employeeId, {
    skip: !employeeId,
  });

  const pips = pipsResp?.data ?? [];
  const idps = idpsResp?.data ?? [];
  const activePip = pips.find((pip: PipResponse) =>
    pip.status === PipStatus.ACTIVE ||
    pip.status === PipStatus.IN_PROGRESS ||
    pip.status === PipStatus.EXTENDED,
  );
  const activeIdp = idps.find((idp: IdpResponse) => idp.status === IdpStatus.ACTIVE);

  const dynamicSkills = useMemo(() => {
    if (!goalItems.length) return [];
    const categoryMap = new Map<string, { totalProgress: number; count: number }>();

    goalItems.forEach((item) => {
      const category = item.categoryName || "General Productivity";
      const current = categoryMap.get(category) || { totalProgress: 0, count: 0 };
      current.totalProgress += Math.min(Math.max(getProgress(item), 0), 100);
      current.count += 1;
      categoryMap.set(category, current);
    });

    return Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        value: Math.round(data.totalProgress / data.count),
        color: skillColors[index % skillColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [goalItems]);

  if (isEmployeeLoading) {
    return (
      <div className="py-16 text-center" style={{ color: "#9EA3B0", fontSize: 13 }}>
        Loading employee profile...
      </div>
    );
  }

  if (employeeError || !employee) {
    return (
      <div className="py-16 text-center" style={{ color: "#791F1F", fontSize: 13 }}>
        Employee profile could not be loaded.
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[(employee.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 mb-2 transition-colors"
            style={{ color: "#5A6070", fontSize: 12 }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>Employee Profile</h1>
          <p style={{ fontSize: 13, color: "#9EA3B0", marginTop: 2 }}>
            Performance, appraisal, development, and improvement plan snapshot.
          </p>
        </div>
        <Link
          to={`/employees/edit/${employee.id}`}
          className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
          style={{
            background: "#1A56DB",
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <UserRound size={14} aria-hidden="true" />
          Edit Employee
        </Link>
      </div>

      <div style={{ ...cardStyle, padding: 20 }} className="flex flex-col lg:flex-row gap-5">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-medium shrink-0 overflow-hidden"
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {employee.profileImage && employee.profileImage !== "default.jpg" ? (
            <img
              src={`http://localhost:8080${employee.profileImage}`}
              alt={employee.staffName}
              className="w-full h-full object-cover"
            />
          ) : (
            employee.staffName?.charAt(0) || "?"
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 style={{ fontSize: 20, fontWeight: 500, color: "#111827" }}>{employee.staffName}</h2>
            {employee.roles?.map((role) => (
              <span
                key={role}
                style={{
                  background: "#EEF3FD",
                  color: "#0C447C",
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "2px 7px",
                  borderRadius: 20,
                }}
              >
                {role.replace("ROLE_", "")}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#9EA3B0", fontFamily: "monospace" }}>
            {employee.employeeCode}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
            <InfoItem icon={<Briefcase size={14} />} label="Position" value={`${employee.positionName}${employee.levelName ? ` (${employee.levelName})` : ""}`} />
            <InfoItem icon={<Target size={14} />} label="Department" value={employee.currentDepartmentName || "Not assigned"} />
            <InfoItem icon={<Mail size={14} />} label="Email" value={employee.email || "Not set"} />
            <InfoItem icon={<Phone size={14} />} label="Phone" value={employee.phoneNo || "Not set"} />
          </div>
        </div>

        <div style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: 16 }} className="w-full lg:w-56">
          <p style={{ fontSize: 10, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Active cycle score
          </p>
          <div style={{ fontSize: 34, fontWeight: 500, color: "#1A56DB", lineHeight: 1, marginTop: 8 }}>
            {scoreBreakdown?.finalTotalScore?.toFixed(1) ?? goalSet?.score?.toFixed(1) ?? "--"}
          </div>
          <div className="mt-2 inline-flex items-center gap-1" style={{ fontSize: 12, color: "#27500A" }}>
            <TrendingUp size={12} aria-hidden="true" />
            {scoreBreakdown?.finalGrade ?? "Grade pending"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <ScoreCard
          label="Self assessment"
          raw={scoreBreakdown?.selfRawScore}
          weighted={scoreBreakdown?.selfWeightedScore}
          loading={isScoreLoading || isAppraisalLoading}
        />
        <ScoreCard
          label="Manager evaluation"
          raw={scoreBreakdown?.managerRawScore}
          weighted={scoreBreakdown?.managerWeightedScore}
          loading={isScoreLoading || isAppraisalLoading}
        />
        <ScoreCard
          label="360 feedback"
          raw={scoreBreakdown?.feedbackRawScore}
          weighted={scoreBreakdown?.feedbackWeightedScore}
          loading={isScoreLoading || isAppraisalLoading}
        />
        <ScoreCard
          label="KPI"
          raw={scoreBreakdown?.kpiRawScore}
          weighted={scoreBreakdown?.kpiWeightedScore}
          loading={isScoreLoading || isAppraisalLoading}
        />
      </div>

      {appraisalError && (
        <div style={{ ...cardStyle, padding: "12px 14px", background: "#FAEEDA", borderColor: "#F0D4A4" }}>
          <p style={{ fontSize: 12, color: "#633806" }}>
            No appraisal data is available for this employee in the active cycle.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div style={{ ...cardStyle, padding: 16 }}>
          <SectionHeader title="Active Goals" subtitle={activeCycle?.cycleName || "Current cycle"} />
          <div className="space-y-3 mt-4">
            {isGoalsLoading ? (
              <p style={{ fontSize: 12, color: "#9EA3B0" }}>Loading goals...</p>
            ) : goalItems.length > 0 ? (
              goalItems.map((item) => {
                const progress = getProgress(item);
                return (
                  <div key={item.id} style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 10, padding: 12 }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{item.title || item.kpiName || item.customKpiName}</p>
                        <p style={{ fontSize: 11, color: "#9EA3B0", marginTop: 3 }}>{item.categoryName || "General"} / {item.weightPercent ?? item.weightage ?? 0}% weight</p>
                      </div>
                      <span style={{ ...statusPillStyle(item.status), fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>
                        {formatStatus(item.status)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontSize: 11, color: "#9EA3B0" }}>Progress</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#111827" }}>{progress}%</span>
                      </div>
                      <div style={{ height: 6, background: "#EEF0F6", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: "#1A56DB", borderRadius: 3 }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="No active goals found for this cycle." />
            )}
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 16 }}>
          <SectionHeader title="Skill Breakdown" subtitle="From KPI categories" />
          <div className="space-y-5 mt-5">
            {dynamicSkills.length > 0 ? (
              dynamicSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span style={{ fontSize: 12, color: "#111827" }}>{skill.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{skill.value}%</span>
                  </div>
                  <div style={{ height: 6, background: "#EEF0F6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${skill.value}%`, background: skill.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No skill data is available yet." />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <PlanCard
            title="Active PIP"
            loading={isPipsLoading}
            emptyText="No active PIP for this employee."
            plan={activePip}
            href={activePip ? `/pip/${activePip.pipId}` : undefined}
            fields={[
              ["Status", formatStatus(activePip?.status)],
              ["Timeline", `${formatDate(activePip?.startDate)} - ${formatDate(activePip?.endDate)}`],
              ["Progress", `${activePip?.overallProgress ?? 0}%`],
              ["Severity", formatStatus(activePip?.severity)],
            ]}
          />
          <PlanCard
            title="Active IDP"
            loading={isIdpsLoading}
            emptyText="No active IDP for this employee."
            plan={activeIdp}
            href={activeIdp ? `/idp/${activeIdp.idpId}` : undefined}
            fields={[
              ["Status", formatStatus(activeIdp?.status)],
              ["Timeline", `${formatDate(activeIdp?.startDate)} - ${formatDate(activeIdp?.endDate)}`],
              ["Mentor", activeIdp?.managerName || "Not assigned"],
              ["Progress", `${activeIdp?.overallProgress ?? 0}%`],
            ]}
          />
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-2">
    <span style={{ color: "#9EA3B0", marginTop: 2 }}>{icon}</span>
    <div className="min-w-0">
      <p style={{ fontSize: 10, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 12, color: "#5A6070", marginTop: 2, overflowWrap: "anywhere" }}>{value}</p>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex items-start justify-between gap-3">
    <h3 style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{title}</h3>
    {subtitle && <span style={{ fontSize: 11, color: "#9EA3B0" }}>{subtitle}</span>}
  </div>
);

const ScoreCard = ({
  label,
  raw,
  weighted,
  loading,
}: {
  label: string;
  raw?: number;
  weighted?: number;
  loading: boolean;
}) => (
  <div style={{ ...cardStyle, padding: "14px 16px" }}>
    <div className="flex items-center justify-between gap-2">
      <p style={{ fontSize: 12, fontWeight: 500, color: "#5A6070" }}>{label}</p>
      {raw !== undefined ? (
        <CheckCircle2 size={14} style={{ color: "#639922" }} />
      ) : (
        <Clock size={14} style={{ color: "#9EA3B0" }} />
      )}
    </div>
    <p style={{ fontSize: 22, fontWeight: 500, color: "#111827", marginTop: 10 }}>
      {loading ? "..." : raw !== undefined ? raw.toFixed(1) : "--"}
    </p>
    <p style={{ fontSize: 11, color: "#9EA3B0", marginTop: 2 }}>
      Weighted: {weighted !== undefined ? weighted.toFixed(1) : "--"}
    </p>
  </div>
);

const PlanCard = ({
  title,
  loading,
  emptyText,
  plan,
  href,
  fields,
}: {
  title: string;
  loading: boolean;
  emptyText: string;
  plan?: PipResponse | IdpResponse;
  href?: string;
  fields: [string, string][];
}) => (
  <div style={{ ...cardStyle, padding: 16 }}>
    <SectionHeader title={title} />
    {loading ? (
      <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 14 }}>Loading...</p>
    ) : plan ? (
      <div className="mt-4 space-y-3">
        {fields.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span style={{ fontSize: 11, color: "#9EA3B0" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#111827", textAlign: "right" }}>{value}</span>
          </div>
        ))}
        {href && (
          <Link
            to={href}
            className="inline-flex items-center gap-1.5 mt-2 transition-colors"
            style={{ color: "#1A56DB", fontSize: 12, fontWeight: 500, textDecoration: "none" }}
          >
            <Calendar size={13} aria-hidden="true" />
            View details
          </Link>
        )}
      </div>
    ) : (
      <EmptyState text={emptyText} />
    )}
  </div>
);

export default EmployeeProfileView;
