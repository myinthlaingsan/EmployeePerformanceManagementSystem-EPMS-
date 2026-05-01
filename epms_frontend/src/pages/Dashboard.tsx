import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager, isSenior } = useAuth();
  const navigate = useNavigate();

  if (!user) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
    </div>
  );

  const metrics = [
    { label: 'Active PIPs', value: '12', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Pending Reviews', value: '04', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completion Rate', value: '88%', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

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
          <button 
            onClick={() => navigate("/pip/new")}
            className="bg-brand-primary text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2"
          >
            <span className="text-lg">+</span> New Plan
          </button>
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
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Role-Specific Action Centers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(isAdmin || isHR) && (
              <section className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/hr")}>
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <svg className="w-24 h-24 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-blue-900 mb-2">Organization</h2>
                <p className="text-blue-700/70 text-sm font-medium mb-6">Manage employee directory, departments, and system access.</p>
                <span className="inline-flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-widest">
                  HR Panel <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </section>
            )}

            {isManager && (
              <section className="bg-emerald-50/50 p-8 rounded-[2rem] border border-emerald-100 relative overflow-hidden group cursor-pointer" onClick={() => navigate("/pip")}>
                 <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                  <svg className="w-24 h-24 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-900 mb-2">Team Tracking</h2>
                <p className="text-emerald-700/70 text-sm font-medium mb-6">Monitor direct reports, review KPIs, and manage PIP progress.</p>
                <span className="inline-flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-widest">
                  Review Team <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </section>
            )}
          </div>

          {/* Activity/Task Section */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-surface-border shadow-premium">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-brand-primary tracking-tight">Pending Actions</h2>
              <button className="text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:underline">See Ledger</button>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-5 bg-surface-base rounded-2xl border border-surface-border group hover:border-brand-secondary transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-brand-primary">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-text-title text-sm">Monthly Review: John Doe</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Due in 2 days</p>
                    </div>
                  </div>
                  <button className="bg-white px-4 py-2 rounded-lg text-xs font-bold text-text-title border border-surface-border hover:bg-gray-50 shadow-sm">Start Review</button>
               </div>
               
               <div className="flex items-center justify-between p-5 bg-surface-base rounded-2xl border border-surface-border opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-text-muted">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="font-bold text-text-title text-sm">Update KPI Targets</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-widest">Completed</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Done</span>
               </div>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Profile Quick Card */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium text-center">
            <div className="relative inline-block mb-6">
               <div className="w-24 h-24 rounded-[2rem] bg-brand-primary flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-brand-primary/40 mx-auto">
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
                <span className="text-xs font-bold text-text-title">Engineering</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/profile")}
              className="w-full mt-8 bg-surface-base text-text-title px-4 py-3 rounded-xl hover:bg-gray-100 transition font-bold text-xs border border-surface-border shadow-sm"
            >
              View Full Profile
            </button>
          </section>

          {/* Quick Support Card */}
          <section className="bg-[#1e293b] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Need assistance?</h3>
                <p className="text-gray-400 text-xs font-medium mb-6">Our HR support team is available for system walkthroughs and guidance.</p>
                <button className="bg-white text-gray-900 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 transition shadow-lg">Contact HR</button>
             </div>
             <div className="absolute -bottom-10 -right-10 opacity-10">
                <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

