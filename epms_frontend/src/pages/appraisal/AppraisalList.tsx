import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useGetAppraisalsQuery, 
  useGetCyclesQuery, 
  useGetAppraisalFormsQuery,
  useGetAppraisalsByCycleQuery,
  useActivateCycleMutation,
  useCloseCycleMutation
} from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';
import { 
  Plus, 
  Layers, 
  ClipboardList, 
  Calendar,
  FileText,
  ChevronRight,
  Settings,
  Clock,
  Target,
  Users,
  CheckCircle2,
  CheckCircle,
  Circle,
  AlertCircle,
  Search,
  Filter,
  Mail,
  Share2,
  ArrowUpRight,
  Trophy
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';

const AppraisalList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isHR } = useAuth();
  const isPrivileged = isAdmin || isHR;

  const [activeTab, setActiveTab] = React.useState<'appraisals' | 'cycles' | 'forms'>(
    location.state?.activeTab || (isPrivileged ? 'cycles' : 'appraisals')
  );
  const [selectedCycleId, setSelectedCycleId] = React.useState<number | null>(null);
  const [expandedCycle, setExpandedCycle] = React.useState<string | null>(location.state?.expandedCycle || null);
  const [expandedSet, setExpandedSet] = React.useState<string | null>(location.state?.expandedSet || null);
  const [showNewSetModal, setShowNewSetModal] = React.useState(false);
  const [newSetName, setNewSetName] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: appraisals = [], isLoading: loadingAppraisals, error: errorAppraisals } = useGetAppraisalsQuery();
  const { data: cycles = [], isLoading: loadingCycles } = useGetCyclesQuery(undefined, { skip: !isPrivileged });
  const { data: forms = [], isLoading: loadingForms } = useGetAppraisalFormsQuery(undefined, { skip: !isPrivileged });
  const { data: appraisalsByCycle = [], isLoading: loadingCycleData } = useGetAppraisalsByCycleQuery(selectedCycleId || 0, { skip: !selectedCycleId || !isPrivileged });
  const [activateCycle, { isLoading: isActivating }] = useActivateCycleMutation();
  const [closeCycle, { isLoading: isClosing }] = useCloseCycleMutation();

  const isLoading = loadingAppraisals || (isPrivileged && (loadingCycles || loadingForms || (selectedCycleId && loadingCycleData)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (errorAppraisals) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto mt-20">
        Operation failed. Please try again.
      </div>
    );
  }

  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SELF_ASSESSED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'EVALUATED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'HR_APPROVED': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderAppraisals = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {appraisals.length > 0 ? appraisals.map((appraisal: any) => (
        <div 
          key={appraisal.appraisalId}
          className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col"
          onClick={() => navigate(`/appraisal/${appraisal.appraisalId}`)}
        >
          {/* Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appraisal.status)}`}>
              {appraisal.status.replace('_', ' ')}
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{appraisal.cycleName}</p>
            <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
              {appraisal.employeeName}
            </h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">Performance Assessment</p>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-slate-50 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Target className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-500">Progress</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full bg-indigo-500 ${appraisal.status === 'FINALIZED' ? 'w-full' : appraisal.status === 'PENDING' ? 'w-1/4' : 'w-2/3'}`}></div>
                 </div>
                 <span className="text-[10px] font-black text-slate-900">{appraisal.status === 'FINALIZED' ? '100%' : '65%'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                Updated {appraisal.updatedAt ? format(new Date(appraisal.updatedAt), 'MMM dd') : 'Recently'}
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                <ChevronRight className="w-4 h-4" />
             </div>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
            <ClipboardList className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Assessments Found</h3>
          <p className="text-slate-400 font-medium mb-8">You don't have any performance assessments assigned at this time.</p>
        </div>
      )}
    </div>
  );

  const renderCycles = () => {
    // ── Helper: Calculate Days Remaining ─────────────────────────────────────
    const getDaysRemaining = (endDate: string) => {
      const diff = new Date(endDate).getTime() - new Date().getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    };

    // ── LEVEL 2: Cycle Dashboard ─────────────────────────────────────────────
    if (selectedCycleId) {
      const cycle = cycles.find((c: any) => Number(c.cycleId) === Number(selectedCycleId));
      const cycleForms = forms.filter((f: any) => {
        const idMatch = f.cycleId && Number(f.cycleId) === Number(selectedCycleId);
        const nameMatch = f.cycleName && cycle?.cycleName && f.cycleName === cycle.cycleName;
        return idMatch || nameMatch;
      });

      const daysLeft = getDaysRemaining(cycle?.endDate);

      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Breadcrumbs & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCycleId(null)}
                className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all w-fit mb-4"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                </div>
                Back to Cycles
              </button>
              
              <div className="flex items-center gap-6">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">{cycle?.cycleName}</h2>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${cycle?.isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cycle?.isActive ? 'bg-indigo-600 animate-pulse' : 'bg-slate-400'}`}></div>
                  {cycle?.status || (cycle?.isActive ? 'IN PROGRESS' : 'INACTIVE')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Clock className="w-4 h-4" />
                {daysLeft > 0 ? `Ends in ${daysLeft} days` : 'Cycle concluded'}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4 text-slate-400" /> Export Status
              </button>
              <button className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Mail className="w-4 h-4" /> Send Reminders
              </button>
              {cycle?.isActive ? (
                <button
                  onClick={() => {
                    if (window.confirm(`Close "${cycle.cycleName}"? This will deactivate it and lock all appraisals.`)) {
                      closeCycle(Number(selectedCycleId));
                      setSelectedCycleId(null);
                    }
                  }}
                  disabled={isClosing}
                  className="px-6 py-3 bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isClosing ? 'Closing...' : '⏹ Close Cycle'}
                </button>
              ) : (
                <button
                  onClick={() => activateCycle(Number(selectedCycleId))}
                  disabled={isActivating}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isActivating ? 'Activating...' : '▶ Activate Cycle'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch mb-8">
            {/* Global Completion Rates (Top Left) */}
            <div className="lg:col-span-3 flex">
              {(() => {
                const total = appraisalsByCycle.length;
                const selfCount = appraisalsByCycle.filter((a: any) => !['PENDING'].includes(a.status)).length;
                const managerCount = appraisalsByCycle.filter((a: any) => ['EVALUATED', 'HR_APPROVED', 'FINALIZED'].includes(a.status)).length;
                const finalCount = appraisalsByCycle.filter((a: any) => a.status === 'FINALIZED').length;
                
                const selfRate = total > 0 ? Math.round((selfCount / total) * 100) : 0;
                const managerRate = total > 0 ? Math.round((managerCount / total) * 100) : 0;
                const finalRate = total > 0 ? Math.round((finalCount / total) * 100) : 0;
                const totalRate = total > 0 ? Math.round((selfRate + managerRate + finalRate) / 3) : 0;

                return (
                  <div className="bg-white rounded-[1rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden group w-full flex flex-col justify-between min-h-[320px]">
                    <div className="flex justify-between items-start relative z-10 mb-20">
                      <div>
                        <h3 className="text-[11px] font-black text-[#5E718D] uppercase tracking-[0.15em] mb-1">Global Completion Rates</h3>
                        <p className="text-[13px] font-medium text-slate-400">Status update across all participating departments</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[3rem] font-black text-[#0052CC] tracking-tight leading-none">{totalRate}% Total</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 relative z-10 pb-8">
                      {[
                        { label: 'Self-Assessments', rate: selfRate, color: 'bg-[#0052CC]', sub: `${selfCount} of ${total} submitted` },
                        { label: 'Manager Evaluations', rate: managerRate, color: 'bg-[#0052CC]', sub: `${managerCount} of ${total} reviews complete` },
                        { label: 'Final Sign-offs', rate: finalRate, color: 'bg-[#94A3B8]', sub: `${finalCount} finalized sessions` },
                      ].map((stat, i) => (
                        <div key={i} className="flex-1 space-y-2">
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[14px] font-bold text-slate-700">{stat.label}</span>
                            <span className="text-[14px] font-black text-slate-900">{stat.rate}%</span>
                          </div>
                          <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.color} transition-all duration-1000 rounded-full`} style={{ width: `${stat.rate}%` }}></div>
                          </div>
                          <p className="text-[11px] font-medium text-slate-400">{stat.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Cycle Timeline (Top Right) */}
            <div className="lg:col-span-1 flex">
              <div className="bg-[#E9EEF2] rounded-[1rem] p-8 shadow-sm border border-slate-200/50 w-full flex flex-col min-h-[320px]">
                <h3 className="text-[11px] font-black text-[#5E718D] uppercase tracking-[0.15em] mb-8">Cycle Timeline</h3>
                
                <div className="space-y-6 relative flex-1">
                  <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-slate-300"></div>
                  
                  {[
                    { label: 'Cycle Launched', date: cycle?.startDate, status: 'complete' },
                    { label: 'Self-Assessment Deadline', date: cycle?.selfAssessmentDeadline, status: 'complete' },
                    { label: 'Manager Reviews Close', date: cycle?.managerEvaluationDeadline, status: 'active', active: true },
                    { label: 'Cycle Finalization', date: cycle?.finalizationDeadline, status: 'upcoming' },
                  ].map((step, i) => (
                    <div key={i} className="flex gap-6 relative z-10 items-start">
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                        step.status === 'complete' ? 'bg-[#0052CC] text-white shadow-lg shadow-blue-200/50' : 
                        step.active ? 'bg-[#DDEBFF]' : 
                        'bg-[#DDE9F0]'
                      }`}>
                        {step.status === 'complete' ? <CheckCircle2 className="w-5 h-5" /> : 
                         step.active ? <div className="w-3.5 h-3.5 bg-[#0052CC] rounded-full" /> : 
                         null}
                      </div>
                      <div className="pt-1">
                        <h4 className={`text-[13px] font-black leading-tight ${step.active ? 'text-[#0052CC]' : 'text-[#2C3E50]'}`}>
                          {step.label}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          {safeFormatDate(step.date)}
                          {step.active && daysLeft > 0 && ` (In ${daysLeft}d)`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-8 py-3 bg-white border border-slate-200 text-[#2C3E50] font-black text-[11px] rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  Extend All Deadlines
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Participant List (Table) */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search employees, departments, or managers..."
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <div className="flex items-center gap-4">
                      <button className="px-6 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filters
                      </button>
                      <span className="text-xs font-bold text-slate-400">Showing {appraisalsByCycle.length} Participants</span>
                   </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Manager</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {appraisalsByCycle.filter((a: any) => 
                        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.managerName?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((appraisal: any) => (
                        <tr key={appraisal.appraisalId} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm group-hover:scale-110 transition-transform">
                                {appraisal.employeeName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{appraisal.employeeName}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{appraisal.employeeCode || 'EMP-ID'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-medium text-slate-600">
                             Development
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-slate-700">{appraisal.managerName || 'System'}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appraisal.status)}`}>
                              {appraisal.status.replace('_', ' ')}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button 
                               onClick={() => navigate(`/appraisal/${appraisal.appraisalId}`)}
                               className="text-indigo-600 hover:text-indigo-800 font-black text-xs uppercase tracking-widest transition-colors"
                             >
                               View Details
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Simple Pagination Placeholder */}
                <div className="p-8 border-t border-slate-50 flex items-center justify-between">
                   <p className="text-xs font-bold text-slate-400">Showing 1 to {appraisalsByCycle.length} of {appraisalsByCycle.length} results</p>
                   <div className="flex items-center gap-2">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><ChevronRight className="w-4 h-4 rotate-180" /></button>
                      <button className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-indigo-100">1</button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 font-black text-xs hover:bg-slate-50 transition-all">2</button>
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Scoring Weightage */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-xl shadow-slate-200">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-2 bg-white/10 rounded-xl">
                      <Target className="w-5 h-5 text-indigo-300" />
                   </div>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Scoring Weightage</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    { label: 'KPI / Results', weight: cycle?.kpiWeight || 40, color: 'bg-indigo-400' },
                    { label: 'Manager Eval', weight: cycle?.managerWeight || 40, color: 'bg-violet-400' },
                    { label: 'Self Eval', weight: cycle?.selfWeight || 10, color: 'bg-blue-400' },
                    { label: '360 Feedback', weight: cycle?.feedbackWeight || 10, color: 'bg-emerald-400' },
                  ].map((w, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">{w.label}</span>
                        <span>{Number(w.weight).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${w.color}`} style={{ width: `${w.weight}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                     Total weight must equal <span className="text-white font-black">100%</span>. These weights determine the final calculated score for each participant.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ── LEVEL 1: Cycle Grid ──────────────────────────────────────────────────
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cycles.length > 0 ? cycles.map((cycle: any) => (
          <div 
            key={cycle.cycleId}
            onClick={() => setSelectedCycleId(cycle.cycleId)}
            className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col"
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl ${cycle.isActive ? 'bg-indigo-600' : 'bg-slate-400'}`}></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cycle.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                {cycle.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="relative z-10 flex-1">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{cycle.financialYearTitle || 'Annual Review'}</p>
              <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{cycle.cycleName}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">{cycle.evaluationPeriod}</p>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-slate-50 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">Weightage</span>
                </div>
                <span className="text-xs font-black text-slate-900">Balanced</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-500">Completion</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-3/4"></div>
                   </div>
                   <span className="text-[10px] font-black text-slate-900">74%</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" />
                  Ends {safeFormatDate(cycle.endDate)}
               </div>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
               </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Appraisal Cycles</h3>
            <p className="text-slate-400 font-medium mb-8">Begin by creating a performance cycle for your organization.</p>
            <button 
              onClick={() => navigate('/appraisal/create-cycle')}
              className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3 mx-auto"
            >
              <Plus className="w-5 h-5" /> Create First Cycle
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderForms = () => {
    // 1. Group all forms by cycle
    const groupedForms: Record<string, any[]> = {};
    cycles.forEach((c: any) => { groupedForms[c.cycleName] = []; });
    forms.forEach((form: any) => {
      const key = form.cycleName || 'Unassigned';
      if (!groupedForms[key]) groupedForms[key] = [];
      groupedForms[key].push(form);
    });

    // Helper: Parse "SetName | Form label"
    const getSetName = (formName: string) => {
      const idx = formName.indexOf(' | ');
      return idx >= 0 ? formName.slice(0, idx).trim() : '__unassigned__';
    };

    // Helper: Group forms in a cycle by their set name
    const buildSetMap = (cycleName: string) => {
      const map = new Map<string, { self: any; manager: any }>();
      (groupedForms[cycleName] || []).forEach((f: any) => {
        const sn = getSetName(f.formName);
        if (!map.has(sn)) map.set(sn, { self: null, manager: null });
        const entry = map.get(sn)!;
        if (f.formType === 'SELF_ASSESSMENT') entry.self = f;
        else if (f.formType === 'MANAGER_EVALUATION') entry.manager = f;
      });
      return map;
    };

    // ── LEVEL 3: Inside a Form Set ──────────────────────────────────────────
    if (expandedCycle && expandedSet) {
      const cycleData = cycles.find((c: any) => c.cycleName === expandedCycle);
      const setMap = buildSetMap(expandedCycle);
      const thisSet = setMap.get(expandedSet) || { self: null, manager: null };

      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => { setExpandedCycle(null); setExpandedSet(null); }}>Cycles</span>
                <ChevronRight className="w-3 h-3" />
                <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setExpandedSet(null)}>{expandedCycle}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{expandedSet}</span>
              </nav>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Design Form Set</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Configure evaluation templates for the {expandedSet} group.</p>
            </div>
            
            <button 
              onClick={() => setExpandedSet(null)}
              className="px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 w-fit"
            >
              <ChevronRight className="w-4 h-4 rotate-180" /> Back to Sets
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { type: 'SELF_ASSESSMENT', label: 'Self Assessment', icon: ClipboardList, color: 'blue', form: thisSet.self },
              { type: 'MANAGER_EVALUATION', label: 'Manager Evaluation', icon: FileText, color: 'indigo', form: thisSet.manager },
            ].map(({ type, label, icon: Icon, color, form }) => (
              <div key={type} className="group bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl ${color === 'blue' ? 'bg-blue-600' : 'bg-indigo-600'}`}></div>
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={`p-5 rounded-[1.25rem] ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  {form && (
                    <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Ready to use
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    {form ? (form.formName.split(' | ')[1] || form.formName) : label}
                  </h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                    {form 
                      ? `Full template configured with ${form.categoryCount || 0} sections and custom evaluation criteria.` 
                      : `No ${label.toLowerCase()} template has been designed for this specific position set.`}
                  </p>
                </div>
                
                <div className="pt-8 border-t border-slate-50 relative z-10">
                  {form ? (
                    <button 
                      onClick={() => navigate(`/appraisal/forms/${form.formId}`)}
                      className="w-full py-4 bg-slate-50 text-slate-700 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg"
                    >
                      View Full Template <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/appraisal/design-form?cycleId=${cycleData?.cycleId}&type=${type}&setName=${encodeURIComponent(expandedSet)}`)}
                      className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <Plus className="w-4 h-4" /> Design Template
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── LEVEL 2: Cycle Selected (Show Form Sets) ────────────────────────────
    if (expandedCycle) {
      const setMap = buildSetMap(expandedCycle);
      const sets = Array.from(setMap.entries());

      return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setExpandedCycle(null)}>Cycles</span>
                <ChevronRight className="w-3 h-3" />
                <span>{expandedCycle}</span>
              </nav>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Position Form Sets</h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Manage grouped templates for different positions or teams.</p>
            </div>
            
            <button 
              onClick={() => { setShowNewSetModal(true); setNewSetName(''); }}
              className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Create Form Set
            </button>
          </div>

          {showNewSetModal && (
            <div className="bg-white rounded-[2.5rem] border-2 border-indigo-200 p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Define New Form Set</h3>
                  <p className="text-sm text-slate-400 font-medium">Create a template group for a specific department or seniority level.</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  autoFocus
                  type="text" 
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all"
                />
                <button 
                  disabled={!newSetName.trim()}
                  onClick={() => { setExpandedSet(newSetName); setShowNewSetModal(false); }}
                  className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-50"
                >
                  Create & Design
                </button>
                <button 
                  onClick={() => setShowNewSetModal(false)}
                  className="px-6 py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sets.map(([setName, set]) => {
              const isComplete = set.self && set.manager;
              return (
                <div 
                  key={setName}
                  onClick={() => setExpandedSet(setName)}
                  className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-4 rounded-xl ${isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isComplete ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {isComplete ? 'Ready' : 'Incomplete'}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 group-hover:text-indigo-600 transition-colors">{setName}</h3>
                  <div className="space-y-3 pt-6 border-t border-slate-50">
                    <div className={`flex items-center justify-between text-xs font-black ${set.self ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-2 uppercase tracking-wider">Self Assessment</span>
                      {set.self ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-20" />}
                    </div>
                    <div className={`flex items-center justify-between text-xs font-black ${set.manager ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className="flex items-center gap-2 uppercase tracking-wider">Manager Evaluation</span>
                      {set.manager ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-20" />}
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                        <ChevronRight className="w-4 h-4" />
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ── LEVEL 1: Cycle List ─────────────────────────────────────────────────
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.keys(groupedForms).map((cycleName) => {
          const cycleData = cycles.find((c: any) => c.cycleName === cycleName);
          return (
            <div 
              key={cycleName}
              onClick={() => { setExpandedCycle(cycleName); setExpandedSet(null); }}
              className="group bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col"
            >
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cycleData?.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  {cycleData?.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              
              <div className="relative z-10 flex-1 text-center">
                <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{cycleName}</h3>
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-8">
                  {buildSetMap(cycleName).size} Form Set(s)
                </p>
              </div>
              
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                 <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    Configure Templates
                 </div>
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ChevronRight className="w-4 h-4" />
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-slate-900 rounded-2xl text-white shadow-xl shadow-slate-200">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Appraisal Hub</h1>
                <p className="text-slate-400 font-medium tracking-tight">Organization performance & evaluation management system</p>
              </div>
            </div>
          </div>
          
          {isPrivileged && (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/appraisal/create-cycle')}
                className="px-8 py-4 bg-white text-slate-700 font-black text-sm rounded-2xl hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-3"
              >
                <Calendar className="w-5 h-5 text-indigo-600" /> New Cycle
              </button>
              <button 
                onClick={() => navigate('/appraisal/assign')}
                className="px-8 py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center gap-3"
              >
                <Plus className="w-5 h-5" /> Bulk Assign
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {isPrivileged && (
          <div className="flex items-center gap-2 bg-slate-200/40 p-1.5 rounded-3xl mb-12 w-fit">
            {[
              { id: 'appraisals', label: 'My Assessments', icon: ClipboardList },
              { id: 'cycles', label: 'Dashboard', icon: Target },
              { id: 'forms', label: 'Form Templates', icon: Layers },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedCycleId(null);
                  setExpandedCycle(null);
                  setExpandedSet(null);
                }}
                className={`px-8 py-3.5 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {(() => {
                  const TabIcon = tab.icon;
                  return <TabIcon className="w-4 h-4" />;
                })()}
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="mt-4">
          {activeTab === 'appraisals' && renderAppraisals()}
          {activeTab === 'cycles' && renderCycles()}
          {activeTab === 'forms' && renderForms()}
        </div>

      </div>
    </div>
  );
};

export default AppraisalList;
