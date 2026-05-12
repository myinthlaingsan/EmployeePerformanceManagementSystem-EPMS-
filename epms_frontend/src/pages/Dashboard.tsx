import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useGetActiveDepartmentsQuery, useGetDepartmentHeadcountQuery } from "../features/org/departmentApi";

const HeadcountCard = ({ departmentId, departmentName }: { departmentId: number; departmentName: string }) => {
  const { data: count, isLoading } = useGetDepartmentHeadcountQuery(departmentId);
  return (
    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{departmentName}</span>
      <span className="text-sm font-bold text-brand-primary">{isLoading ? "..." : count}</span>
    </div>
  );
};

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager, isEmployee } = useAuth();
  const navigate = useNavigate();
  const { data: departments } = useGetActiveDepartmentsQuery(undefined, { skip: !isAdmin && !isHR });

  if (!user) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
    </div>
  );

  // 1. Role-Specific Metrics
  const getMetrics = () => {
    if (isAdmin) return [
      { label: 'Total Workforce', value: '428', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Active Depts', value: '08', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { label: 'System Health', value: '100%', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];
    if (isHR) return [
      { label: 'Active PIPs', value: '12', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
      { label: 'Completion Rate', value: '88%', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Training Needs', value: '05', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
    if (isManager) return [
      { label: 'Direct Reports', value: '14', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Team Avg Score', value: '3.8', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Pending Reviews', value: '03', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    ];
    return [
      { label: 'My Last Rating', value: '4.2', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'KPI Progress', value: '75%', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Days to Review', value: '18', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  };

  const metrics = getMetrics();

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">Performance Command Center</p>
          <h1 className="text-4xl font-black text-brand-primary tracking-tight">
            Welcome back, <span className="text-brand-primary">{user.staffName.split(' ')[0]}</span>
          </h1>
          <p className="text-text-muted mt-2 font-medium">
            {user.positionName} <span className="mx-2 text-surface-border">|</span> {user.levelName}
          </p>
        </div>

        <div className="flex gap-3">
          {(isAdmin || isHR || isManager) && (
            <button
              onClick={() => navigate("/pip/new")}
              className="bg-brand-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2"
            >
              <span className="text-lg">+</span> New Plan
            </button>
          )}
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white p-8 rounded-[2rem] border border-surface-border border-l-4 ${m.color.replace('text-', 'border-')} shadow-premium flex items-center justify-between hover:shadow-hover transition-all cursor-default group`}>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{m.label}</p>
              <p className="text-3xl font-black text-brand-primary">{m.value}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${m.bg} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
              <svg className={`w-7 h-7 ${m.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isAdmin && (
              <section className="bg-slate-900 p-8 rounded-4xl text-white relative overflow-hidden group cursor-pointer" onClick={() => navigate("/admin/settings")}>
                <h2 className="text-xl font-bold mb-2">System Config</h2>
                <p className="text-slate-400 text-sm font-medium mb-6">Manage global parameters, appraisal cycles, and system logs.</p>
                <span className="inline-flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                  Admin Console <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </section>
            )}

            {isHR && (
              <section className="bg-blue-50/50 p-8 rounded-4xl border border-blue-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/hr/employees")}>
                <h2 className="text-xl font-bold text-blue-900 mb-2">Talent Management</h2>
                <p className="text-blue-700/70 text-sm font-medium mb-6">Oversee hiring, performance reviews, and department structures.</p>
                <span className="inline-flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-widest">
                  HR Panel <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </section>
            )}

            {isManager && (
              <section className="bg-emerald-50/50 p-8 rounded-4xl border border-emerald-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/team")}>
                <h2 className="text-xl font-bold text-emerald-900 mb-2">Team Tracking</h2>
                <p className="text-emerald-700/70 text-sm font-medium mb-6">Monitor direct reports, review KPIs, and manage PIP progress.</p>
                <span className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
                  Review Team <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </section>
            )}

            {isEmployee && (
              <section className="bg-amber-50/50 p-8 rounded-4xl border border-amber-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/appraisal/self")}>
                <h2 className="text-xl font-bold text-amber-900 mb-2">My Growth</h2>
                <p className="text-amber-700/70 text-sm font-medium mb-6">Submit self-assessments, view feedback, and track your goals.</p>
                <span className="inline-flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-widest">
                  Self Review <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </section>
            )}
          </div>

          {/* Role-Specific Tasks */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-surface-border shadow-premium">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-brand-primary tracking-tight">
                {isEmployee ? "My Action Items" : isManager ? "Team Tasks" : "System Alerts"}
              </h2>
              <button className="text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:underline">Full View</button>
            </div>
            <div className="space-y-4">
              {/* Mock data for demonstration */}
              <div className="flex items-center justify-between p-5 bg-surface-base rounded-2xl border border-surface-border group hover:border-brand-secondary transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-primary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-text-title text-sm">
                      {isEmployee ? "Submit Self-Assessment" : isManager ? "Review John Doe's PIP" : "Audit Log Review"}
                    </p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">Due in 2 days</p>
                  </div>
                </div>
                <button className="bg-white px-4 py-2 rounded-lg text-xs font-bold text-text-title border border-surface-border hover:bg-gray-50 shadow-sm">
                  {isEmployee ? "Start" : "Action"}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium text-center">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-4xl bg-brand-primary flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-brand-primary/40 mx-auto">
                {user.staffName.charAt(0)}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-text-title tracking-tight">{user.staffName}</h3>
            <p className="text-xs font-bold text-brand-primary uppercase tracking-[0.15em] mt-1">{user.employeeCode}</p>

            <div className="mt-8 pt-8 border-t border-surface-border space-y-4 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Department</span>
                <span className="text-xs font-bold text-text-title">{user.currentDepartmentId || "Engineering"}</span>
              </div>
              {isManager && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Direct Reports</span>
                  <span className="text-xs font-bold text-brand-secondary">14 Staff</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/profile")}
              className="w-full mt-8 bg-surface-base text-text-title px-4 py-3 rounded-xl hover:bg-gray-100 transition font-bold text-xs border border-surface-border shadow-sm"
            >
              View Full Profile
            </button>
          </section>

          {(isAdmin || isHR) && departments && (
            <section className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium">
              <h3 className="text-lg font-bold text-text-title mb-6 tracking-tight">Headcount Oversight</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {departments.map(dept => (
                  <HeadcountCard key={dept.id} departmentId={dept.id} departmentName={dept.departmentName} />
                ))}
              </div>
            </section>
          )}

          {isEmployee && (
            <section className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Goal Milestone</h3>
                <p className="text-indigo-100 text-xs font-medium mb-6">You've completed 3 of your 4 quarterly KPIs. Great job!</p>
                <button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-50 transition shadow-lg" onClick={() => navigate("/appraisal/kpis")}>View Goals</button>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-20">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
