import { useNavigate } from "react-router-dom";
import { useGetCurrentUserQuery } from "../features/employee/employeeapi";
import { useGetGoalSetByEmployeeQuery, useGetActiveCycleQuery } from "../services/kpiApi";
import { useGetAppraisalsQuery } from "../features/appraisal/appraisalApi";
import { 
  User, 
  Settings, 
  Target, 
  History, 
  TrendingUp, 
  Star, 
  MapPin, 
  Mail, 
  Phone,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isProfileLoading } = useGetCurrentUserQuery();
  const { data: activeCycleResp } = useGetActiveCycleQuery();
  const activeCycle = activeCycleResp?.data;
  const activeCycleId = activeCycle?.cycleId;

  const { data: goalSetResp, isLoading: isGoalsLoading } = useGetGoalSetByEmployeeQuery(
    { employeeId: profile?.id ?? 0, cycleId: activeCycleId ?? 0 },
    { skip: !profile?.id || !activeCycleId }
  );
  const goalSet = goalSetResp?.data;

  const { data: appraisals, isLoading: isAppraisalsLoading } = useGetAppraisalsQuery();

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A56DB]"></div>
      </div>
    );
  }

  const avatarColor = AVATAR_COLORS[(profile?.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  // Derived skills from KPI items (just as an example of "Skill Breakdown")
  // In a real app, this might come from a separate skills endpoint
  const mockSkills = [
    { name: "Technical Proficiency", value: 85, color: "#1A56DB" },
    { name: "Team Collaboration", value: 92, color: "#639922" },
    { name: "Leadership", value: 70, color: "#BA7517" },
    { name: "Communication", value: 78, color: "#1A56DB" },
    { name: "Problem Solving", value: 88, color: "#639922" },
  ];

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
          className="flex items-center gap-2 bg-[#1A56DB] hover:bg-[#1648C0] text-white px-[14px] py-[8px] rounded-[8px] text-[13px] font-medium transition-colors"
        >
          <Settings size={14} />
          Edit Profile
        </button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-[12px] p-[20px] flex flex-col md:flex-row gap-6 items-center md:items-start">
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
              {(profile as any)?.contactAddress || "Location not set"}
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
        <div className="bg-[#F5F6F8] border-[0.5px] border-[#E4E6EC] rounded-[12px] p-[16px] w-full md:w-[200px] text-center">
          <p className="text-[10px] font-medium text-[#9EA3B0] uppercase tracking-[0.8px] mb-1">Performance Score</p>
          <div className="text-[32px] font-medium text-[#1A56DB] leading-none mb-1">
            {goalSet?.score?.toFixed(1) || "0.0"}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF3DE] text-[#27500A] text-[11px] font-medium">
            <TrendingUp size={10} />
            On Track
          </div>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        
        {/* Left: Skill Breakdown */}
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-[12px] p-[16px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Skill Breakdown</h3>
            <span className="text-[10px] font-medium text-[#9EA3B0] uppercase tracking-[0.8px]">Current Level</span>
          </div>
          <div className="space-y-5">
            {mockSkills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[12px] text-[#111827]">{skill.name}</span>
                  <span className="text-[12px] font-medium text-[#111827]">{skill.value}%</span>
                </div>
                <div className="h-[6px] bg-[#EEF0F6] rounded-[3px] overflow-hidden">
                  <div 
                    className="h-full rounded-[3px] transition-all duration-500" 
                    style={{ width: `${skill.value}%`, background: skill.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Goal List */}
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-[12px] p-[16px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Active Goals</h3>
            <button className="text-[12px] text-[#1A56DB] hover:underline" onClick={() => navigate("/kpi/my")}>View all</button>
          </div>
          <div className="space-y-3">
            {isGoalsLoading ? (
              <div className="text-center py-4 text-[#9EA3B0]">Loading goals...</div>
            ) : goalSet?.kpiItems && goalSet.kpiItems.length > 0 ? (
              goalSet.kpiItems.map((item: any) => (
                <div key={item.id} className="p-[12px] bg-[#F5F6F8] border-[0.5px] border-[#E4E6EC] rounded-[10px]">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="text-[13px] font-medium text-[#111827] leading-snug">{item.kpiName || item.customKpiName}</p>
                    <div className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      item.status === 'COMPLETED' ? 'bg-[#EAF3DE] text-[#27500A]' : 
                      item.status === 'IN_PROGRESS' ? 'bg-[#EEF3FD] text-[#0C447C]' : 
                      'bg-[#FAEEDA] text-[#633806]'
                    }`}>
                      {item.status === 'COMPLETED' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {item.status?.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-[#9EA3B0]">
                    <span>Target: {item.targetValue}</span>
                    <span>{item.weightage}% Weight</span>
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
        <div className="bg-white border-[0.5px] border-[#E4E6EC] rounded-[12px] p-[16px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[14px] font-medium text-[#111827]">Review History</h3>
          </div>
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-[5px] before:bottom-[5px] before:w-[1px] before:bg-[#E4E6EC]">
            {isAppraisalsLoading ? (
              <div className="text-[#9EA3B0] text-[12px]">Loading history...</div>
            ) : appraisals && appraisals.length > 0 ? (
              appraisals.slice(0, 5).map((appraisal: any) => (
                <div key={appraisal.id} className="relative">
                  <div className="absolute -left-[23px] top-[4px] w-[10px] h-[10px] rounded-full border-2 border-white bg-[#1A56DB]" />
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[13px] font-medium text-[#111827]">{appraisal.cycleName}</p>
                    <span className="text-[11px] text-[#9EA3B0] font-mono">{appraisal.finalScore?.toFixed(1) || "N/A"}</span>
                  </div>
                  <p className="text-[12px] text-[#5A6070]">{appraisal.status?.replace('_', ' ')}</p>
                  <p className="text-[11px] text-[#9EA3B0] mt-1">
                    <Calendar size={10} className="inline mr-1" />
                    {new Date(appraisal.createdAt).toLocaleDateString()}
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

export default ProfilePage;
