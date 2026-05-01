import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { useGetDepartmentsQuery } from "../../features/org/departmentApi";
import { Link } from "react-router-dom";

const HRDashboard = () => {
  const { data: employees } = useGetEmployeesQuery();
  const { data: departments } = useGetDepartmentsQuery();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">Executive Overview</p>
        <h1 className="text-4xl font-black text-brand-primary tracking-tight">HR Management</h1>
        <p className="text-text-muted mt-2 font-medium">Orchestrate organizational growth and performance intelligence.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-surface-border shadow-premium group hover:shadow-hover transition-all">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Employees</div>
          <div className="text-4xl font-black text-brand-primary mt-3">{employees?.length || 0}</div>
          <div className="mt-4 h-1 w-12 bg-brand-primary rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-surface-border shadow-premium group hover:shadow-hover transition-all">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Departments</div>
          <div className="text-4xl font-black text-brand-primary mt-3">{departments?.length || 0}</div>
          <div className="mt-4 h-1 w-12 bg-indigo-500 rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-surface-border shadow-premium group hover:shadow-hover transition-all">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Talent</div>
          <div className="text-4xl font-black text-emerald-600 mt-3">
            {employees?.filter(e => e.id).length || 0}
          </div>
          <div className="mt-4 h-1 w-12 bg-emerald-500 rounded-full"></div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-surface-border shadow-premium group hover:shadow-hover transition-all">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">System Alerts</div>
          <div className="text-4xl font-black text-amber-600 mt-3">0</div>
          <div className="mt-4 h-1 w-12 bg-amber-500 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Hires / Changes */}
        <section className="bg-white p-10 rounded-[2.5rem] border border-surface-border shadow-premium">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-brand-primary tracking-tight">Recent Talent Changes</h2>
            <button className="text-brand-primary text-[10px] font-bold uppercase tracking-widest hover:underline">See Directory</button>
          </div>
          <div className="space-y-4">
            {employees?.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-4 bg-surface-base rounded-2xl border border-transparent hover:border-surface-border transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-surface-border flex items-center justify-center text-brand-primary font-black shadow-sm">
                    {emp.staffName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-brand-primary tracking-tight">{emp.staffName}</div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">{emp.positionName}</div>
                  </div>
                </div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg shadow-sm border border-surface-border">
                  {emp.employeeCode}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-white p-10 rounded-[2.5rem] border border-surface-border shadow-premium">
          <h2 className="text-xl font-black text-brand-primary tracking-tight mb-8">HR Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex flex-col items-start p-6 bg-surface-base rounded-2xl border border-surface-border hover:bg-brand-primary hover:text-white transition-all group">
              <span className="font-black text-sm uppercase tracking-widest">Add New Staff</span>
              <span className="text-[10px] text-text-muted group-hover:text-white/70 mt-1 font-bold">Register new employee</span>
            </button>
            <button className="flex flex-col items-start p-6 bg-surface-base rounded-2xl border border-surface-border hover:bg-indigo-600 hover:text-white transition-all group">
              <span className="font-black text-sm uppercase tracking-widest">Assign Roles</span>
              <span className="text-[10px] text-text-muted group-hover:text-white/70 mt-1 font-bold">Update permissions</span>
            </button>
            <button className="flex flex-col items-start p-6 bg-surface-base rounded-2xl border border-surface-border hover:bg-emerald-600 hover:text-white transition-all group">
              <span className="font-black text-sm uppercase tracking-widest">View Reports</span>
              <span className="text-[10px] text-text-muted group-hover:text-white/70 mt-1 font-bold">Export personnel data</span>
            </button>
            <button className="flex flex-col items-start p-6 bg-surface-base rounded-2xl border border-surface-border hover:bg-amber-600 hover:text-white transition-all group">
              <span className="font-black text-sm uppercase tracking-widest">Policy Updates</span>
              <span className="text-[10px] text-text-muted group-hover:text-white/70 mt-1 font-bold">Manage documents</span>
            </button>
          </div>
        </section>
      </div>

      {/* Appraisal Management Section */}
      <section className="bg-white p-10 rounded-[2.5rem] border border-surface-border shadow-premium">
        <h2 className="text-xl font-black text-brand-primary tracking-tight mb-8">Appraisal Orchestration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 border border-surface-border rounded-[2rem] bg-surface-base flex flex-col justify-between group hover:border-brand-primary transition-all">
            <div>
              <h3 className="font-black text-brand-primary text-lg mb-2 tracking-tight">Form Frameworks</h3>
              <p className="text-sm text-text-muted font-medium mb-6 leading-relaxed">Design specialized appraisal schemas and metric weights.</p>
            </div>
            <Link to="/appraisal-forms" className="text-brand-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
              Configure Systems <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
          <div className="p-8 border border-surface-border rounded-[2rem] bg-surface-base flex flex-col justify-between group hover:border-indigo-600 transition-all">
            <div>
              <h3 className="font-black text-brand-primary text-lg mb-2 tracking-tight">Active Cycles</h3>
              <p className="text-sm text-text-muted font-medium mb-6 leading-relaxed">Monitor ongoing performance evaluations and check-ins.</p>
            </div>
            <Link to="/appraisal-management" className="text-brand-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-2">
              Monitor Live <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
          <div className="p-8 border border-surface-border rounded-[2rem] bg-surface-base flex flex-col justify-between group hover:border-emerald-600 transition-all">
            <div>
              <h3 className="font-black text-brand-primary text-lg mb-2 tracking-tight">Analytical Insights</h3>
              <p className="text-sm text-text-muted font-medium mb-6 leading-relaxed">Synthesize finalized performance results into actionable data.</p>
            </div>
            <button className="text-text-muted text-xs font-black uppercase tracking-widest cursor-not-allowed flex items-center gap-2" title="Feature coming soon">
              Generate Reports <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HRDashboard;