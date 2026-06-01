import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery, useGetDirectReportsQuery, useGetManagerQuery } from "../features/employee/employeeapi";
import { useGetGoalSetByEmployeeQuery, useGetActiveCycleQuery } from "../services/kpiApi";
import { useGetAppraisalsQuery } from "../features/appraisal/appraisalApi";
import type { GoalItemResponse } from "../features/kpi/kpiTypes";
import {
  Settings, 
  Target,
  TrendingUp,
  MapPin, 
  Mail, 
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ShieldCheck,
  Users,
  UserRound
} from "lucide-react";

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const SKILL_COLORS = ["#1A56DB", "#639922", "#BA7517", "#9333EA", "#0369A1", "#E11D48"];

type ProfileGoalItem = GoalItemResponse & {
  kpiName?: string;
  customKpiName?: string;
  weightage?: number;
};

type AppraisalHistoryItem = {
  id?: number;
  appraisalId?: number;
  cycleName?: string;
  finalScore?: number;
  status?: string;
  createdAt?: string;
};

const panelStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "0.5px solid #E4E6EC",
  borderRadius: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#9EA3B0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useGetCurrentUserQuery();
  const { data: manager } = useGetManagerQuery(profile?.id ?? 0, { skip: !profile?.id });
  const { data: directReports } = useGetDirectReportsQuery(profile?.id ?? 0, { skip: !profile?.id });
  const { data: activeCycleResp } = useGetActiveCycleQuery();
  const activeCycle = activeCycleResp?.data;
  const activeCycleId = activeCycle?.cycleId;

  const { data: goalSetResp, isLoading: isGoalsLoading } = useGetGoalSetByEmployeeQuery(
    { employeeId: profile?.id ?? 0, cycleId: activeCycleId ?? 0 },
    { skip: !profile?.id || !activeCycleId }
  );
  const goalSet = goalSetResp?.data;

  const { data: appraisals, isLoading: isAppraisalsLoading } = useGetAppraisalsQuery();

  const goalItems = useMemo<ProfileGoalItem[]>(
    () => goalSet?.kpiItems ?? goalSet?.items ?? [],
    [goalSet?.items, goalSet?.kpiItems],
  );

  const dynamicSkills = useMemo(() => {
    if (!goalItems.length) return [];
    
    const categoryMap = new Map<string, { totalProgress: number; count: number }>();
    
    goalItems.forEach((item) => {
      const cat = item.categoryName || "General Productivity";
      
      let progress = 0;
      if (item.currentProgress !== undefined) {
         progress = item.currentProgress;
      } else if (item.scorePercent !== undefined) {
         progress = item.scorePercent;
      } else if (item.status === 'COMPLETED') {
         progress = 100;
      } else if (item.status === 'IN_PROGRESS') {
         progress = 50;
      }
      
      const existing = categoryMap.get(cat) || { totalProgress: 0, count: 0 };
      existing.totalProgress += Math.min(Math.max(progress, 0), 100);
      existing.count += 1;
      categoryMap.set(cat, existing);
    });

    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name,
      value: Math.round(data.totalProgress / data.count),
      color: SKILL_COLORS[index % SKILL_COLORS.length]
    })).sort((a, b) => b.value - a.value); // Sort by highest value
  }, [goalItems]);

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A56DB]"></div>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[(profile?.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  return (
    <div className="space-y-4 pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className="text-[18px] font-medium text-[#111827]">Employee Profile</h1>
          <p className="text-[13px] text-[#9EA3B0] mt-0.5">View and manage employee performance and details</p>
        </div>
        <button
          onClick={() => navigate("/profile/edit")}
          className="flex items-center gap-2 bg-[#1A56DB] hover:bg-primary-hover text-white px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors"
        >
          <Settings size={14} />
          Edit Profile
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-xl p-5 flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Avatar */}
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-medium shrink-0 overflow-hidden"
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {profile?.profileImage && profile.profileImage !== "default.jpg" ? (
            <img src={`http://localhost:8080${profile.profileImage}`} alt={profile.staffName} className="w-full h-full object-cover" />
          ) : profile?.staffName.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-[20px] font-medium text-[#111827] mb-1">{profile?.staffName}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[13px] text-[#5A6070]">
              <Briefcase size={14} className="text-[#9EA3B0]" />
              {profile?.positionName}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#5A6070]">
              <Target size={14} className="text-[#9EA3B0]" />
              {profile?.currentDepartmentName}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#5A6070]">
              <MapPin size={14} className="text-[#9EA3B0]" />
              {profile?.contactAddress || "Location not set"}
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[13px] text-[#5A6070]">
              <Mail size={14} className="text-[#9EA3B0]" />
              {profile?.email}
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-[#5A6070]">
              <Phone size={14} className="text-[#9EA3B0]" />
              {profile?.phoneNo}
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-[#F5F6F8] border-[0.5px] border-[#E4E6EC] rounded-xl p-4 w-full md:w-50 text-center">
          <p className="text-[10px] font-medium text-[#9EA3B0] uppercase tracking-[0.8px] mb-1">Performance Score</p>
          <div className="text-[32px] font-medium text-[#1A56DB] leading-none mb-1">
            {goalSet?.score?.toFixed(1) || "0.0"}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-fill text-success-text text-[11px] font-medium">
            <TrendingUp size={10} />
            On Track
          </div>
        </div>
      </div>

      {/* Work profile */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2" style={{ ...panelStyle, padding: "16px 18px" }}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={15} style={{ color: "#1A56DB" }} aria-hidden="true" />
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Work profile</h3>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: profile?.status === "ACTIVE" ? "#27500A" : "#633806",
                background: profile?.status === "ACTIVE" ? "#EAF3DE" : "#FAEEDA",
                border: `0.5px solid ${profile?.status === "ACTIVE" ? "#B8DCA0" : "#F0D4A4"}`,
                borderRadius: 20,
                padding: "3px 8px",
              }}
            >
              {profile?.status?.replace("_", " ") ?? "Unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoTile label="Employee code" value={profile?.employeeCode ?? "-"} mono />
            <InfoTile label="Department" value={profile?.currentDepartmentName ?? "Not assigned"} />
            <InfoTile label="Position" value={profile?.positionName ?? "Not assigned"} />
            <InfoTile label="Job level" value={profile?.levelName ? `${profile.levelName} / Rank ${profile.levelRank ?? "-"}` : "Not assigned"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 10, padding: 12 }}>
              <div className="flex items-center gap-2 mb-3">
                <UserRound size={14} style={{ color: "#1A56DB" }} aria-hidden="true" />
                <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Reports to</p>
              </div>
              {manager ? (
                <PersonRow name={manager.staffName} detail={manager.positionName} />
              ) : profile?.directManagerName ? (
                <PersonRow name={profile.directManagerName} detail="Direct manager" />
              ) : (
                <p style={{ fontSize: 12, color: "#9EA3B0" }}>No manager assigned.</p>
              )}
            </div>

            <div style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 10, padding: 12 }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: "#1A56DB" }} aria-hidden="true" />
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>Direct reports</p>
                </div>
                <span style={{ fontSize: 11, color: "#9EA3B0" }}>{directReports?.length ?? 0}</span>
              </div>
              {directReports && directReports.length > 0 ? (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {directReports.map((report) => (
                    <PersonRow key={report.id} name={report.staffName} detail={report.positionName} compact />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#9EA3B0" }}>No direct reports.</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle, padding: "16px 18px" }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={15} style={{ color: "#1A56DB" }} aria-hidden="true" />
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Access</h3>
          </div>

          <div>
            <p style={{ ...labelStyle, marginBottom: 7 }}>Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {profile?.roles?.length ? profile.roles.map((role) => (
                <span
                  key={role}
                  style={{
                    background: "#EEF3FD",
                    color: "#0C447C",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 20,
                  }}
                >
                  {role.replace("ROLE_", "")}
                </span>
              )) : (
                <span style={{ fontSize: 12, color: "#9EA3B0" }}>No roles assigned.</span>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div className="flex items-center justify-between gap-2" style={{ marginBottom: 7 }}>
              <p style={labelStyle}>Permissions</p>
              <span style={{ fontSize: 11, color: "#9EA3B0" }}>{profile?.permissions?.length ?? 0}</span>
            </div>
            {profile?.permissions?.length ? (
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {profile.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2"
                    style={{
                      background: "#FAFBFF",
                      border: "0.5px solid #EEF0F6",
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1A56DB", flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: "#5A6070", overflowWrap: "anywhere" }}>{permission}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#9EA3B0" }}>No explicit permissions found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left: Skill Breakdown */}
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Skill Breakdown</h3>
            <span className="text-[10px] font-medium text-[#9EA3B0] uppercase tracking-[0.8px]">Current Level</span>
          </div>
          <div className="space-y-5">
            {dynamicSkills.length > 0 ? (
              dynamicSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] text-[#111827]">{skill.name}</span>
                    <span className="text-[12px] font-medium text-[#111827]">{skill.value}%</span>
                  </div>
                  <div className="h-1.5 bg-[#EEF0F6] rounded-[3px] overflow-hidden">
                    <div 
                      className="h-full rounded-[3px] transition-all duration-500" 
                      style={{ width: `${skill.value}%`, background: skill.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[#9EA3B0] text-[12px]">
                No skills data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Center: Goal List */}
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Active Goals</h3>
            <button className="text-[12px] text-[#1A56DB] hover:underline" onClick={() => navigate("/kpi/my")}>View all</button>
          </div>
          <div className="space-y-3">
            {isGoalsLoading ? (
              <div className="text-center py-4 text-[#9EA3B0]">Loading goals...</div>
            ) : goalItems.length > 0 ? (
              goalItems.map((item) => (
                <div key={item.id} className="p-3 bg-[#F5F6F8] border-[0.5px] border-[#E4E6EC] rounded-[10px]">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-[13px] font-medium text-[#111827] leading-snug">{item.title || item.kpiName || item.customKpiName}</p>
                    <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      item.status === 'COMPLETED' ? 'bg-success-fill text-success-text' : 
                      item.status === 'IN_PROGRESS' ? 'bg-info-fill text-info-text' : 
                      'bg-warning-fill text-warning-text'
                    }`}>
                      {item.status === 'COMPLETED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {item.status?.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#9EA3B0]">
                    <span>Target: {item.targetValue}</span>
                    <span>{item.weightPercent !== undefined ? item.weightPercent : item.weightage}% Weight</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle size={24} className="mx-auto text-[#9EA3B0] mb-2" />
                <p className="text-[12px] text-[#9EA3B0]">No active goals found for this cycle.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Review History Timeline */}
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Review History</h3>
          </div>
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-1.75 before:top-1.25 before:bottom-1.25 before:w-px before:bg-[#E4E6EC]">
            {isAppraisalsLoading ? (
              <div className="text-[#9EA3B0] text-[12px]">Loading history...</div>
            ) : appraisals && appraisals.length > 0 ? (
              appraisals.slice(0, 5).map((appraisal: AppraisalHistoryItem) => (
                <div key={appraisal.id ?? appraisal.appraisalId} className="relative">
                  <div className="absolute -left-5.75 top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#1A56DB]" />
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[13px] font-medium text-[#111827]">{appraisal.cycleName}</p>
                    <span className="text-[11px] text-[#9EA3B0] font-mono">{appraisal.finalScore?.toFixed(1) || "N/A"}</span>
                  </div>
                  <p className="text-[12px] text-[#5A6070]">{appraisal.status?.replace('_', ' ')}</p>
                  <p className="text-[11px] text-[#9EA3B0] mt-1">
                    <Calendar size={10} className="inline mr-1" />
                    {appraisal.createdAt ? new Date(appraisal.createdAt).toLocaleDateString() : "Date not set"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-[#9EA3B0]">No appraisal history found.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const InfoTile = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 10, padding: 12 }}>
    <p style={labelStyle}>{label}</p>
    <p
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: "#111827",
        marginTop: 5,
        fontFamily: mono ? "monospace" : undefined,
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </p>
  </div>
);

const PersonRow = ({ name, detail, compact = false }: { name: string; detail?: string; compact?: boolean }) => (
  <div className="flex items-center gap-2">
    <div
      style={{
        width: compact ? 24 : 30,
        height: compact ? 24 : 30,
        borderRadius: "50%",
        background: "#EEF3FD",
        color: "#0C447C",
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {name.charAt(0)}
    </div>
    <div className="min-w-0">
      <p style={{ fontSize: compact ? 12 : 13, fontWeight: 500, color: "#111827", overflowWrap: "anywhere" }}>{name}</p>
      {detail && <p style={{ fontSize: 11, color: "#9EA3B0", marginTop: 1 }}>{detail}</p>}
    </div>
  </div>
);

export default ProfilePage;
