import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useGetAppraisalsQuery, 
  useGetCyclesQuery, 
  useGetAppraisalFormsQuery 
} from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';
import { 
  Plus, 
  Layers, 
  ClipboardList, 
  Calendar,
  FileText,
  ChevronRight,
  Settings
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

  const { data: appraisals = [], isLoading: loadingAppraisals, error: errorAppraisals } = useGetAppraisalsQuery();
  const { data: cycles = [], isLoading: loadingCycles } = useGetCyclesQuery(undefined, { skip: !isPrivileged });
  const { data: forms = [], isLoading: loadingForms } = useGetAppraisalFormsQuery(undefined, { skip: !isPrivileged });

  const isLoading = loadingAppraisals || (isPrivileged && (loadingCycles || loadingForms));

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
      case 'MANAGER_EVALUATED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'HR_APPROVED': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const renderAppraisals = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {appraisals.length > 0 ? appraisals.map((appraisal: any) => (
        <div 
          key={appraisal.appraisalId}
          className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer"
          onClick={() => navigate(`/appraisal/${appraisal.appraisalId}`)}
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(appraisal.status)}`}>
              {appraisal.status.replace('_', ' ')}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {appraisal.assignedAt ? format(new Date(appraisal.assignedAt), 'MMM dd, yyyy') : 'N/A'}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{appraisal.cycleName}</h3>
          <p className="text-slate-500 text-xs mb-6 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            Employee: <span className="font-semibold text-slate-700">{appraisal.employeeName}</span>
          </p>
          
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                {appraisal.employeeName?.charAt(0)}
              </div>
            </div>
            <button className="text-indigo-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )) : (
        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold">No appraisals assigned yet.</p>
          <p className="text-slate-300 text-xs mt-1">When cycles are assigned, they will appear here.</p>
        </div>
      )}
    </div>
  );

  const renderCycles = () => {
    if (selectedCycleId) {
      const selectedCycle = cycles.find((c: any) => Number(c.cycleId) === Number(selectedCycleId));
      
      // Highly robust filter: check ID first, fallback to name if ID is missing
      const cycleForms = forms.filter((f: any) => {
        const idMatch = f.cycleId && selectedCycleId && Number(f.cycleId) === Number(selectedCycleId);
        const nameMatch = f.cycleName && selectedCycle?.cycleName && f.cycleName === selectedCycle.cycleName;
        return idMatch || nameMatch;
      });
      
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedCycleId(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedCycle?.cycleName}</h2>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{selectedCycle?.evaluationPeriod}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/appraisal/assign')}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all text-xs"
              >
                Assign this Cycle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['MANAGER_EVALUATION', 'SELF_ASSESSMENT'].map((type) => {
              const form = cycleForms.find((f: any) => {
                const fType = f.formType?.toString().toUpperCase().replace(/[\s_]/g, '');
                const targetType = type.toUpperCase().replace(/[\s_]/g, '');
                return fType === targetType;
              });
              return (
                <div 
                  key={type}
                  className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${type === 'MANAGER_EVALUATION' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${type === 'MANAGER_EVALUATION' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {type.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-800 mb-2">
                    {form ? form.formName : `${type === 'MANAGER_EVALUATION' ? 'Manager Evaluation' : 'Self Assessment'} Form`}
                  </h3>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    {form 
                      ? `View and manage the ${form.formName.toLowerCase()} template for this cycle.`
                      : `No template has been designed for ${type.toLowerCase()} yet.`}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    {form ? (
                      <button 
                        onClick={() => navigate(`/appraisal/forms/${form.formId}`)}
                        className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        View Template <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/appraisal/design-form?cycleId=${selectedCycleId}&type=${type}`)}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                      >
                        <Plus className="w-4 h-4" /> Design Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cycles.length > 0 ? cycles.map((cycle: any) => (
          <div 
            key={cycle.cycleId}
            onClick={() => setSelectedCycleId(cycle.cycleId)}
            className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cycle.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                {cycle.isActive ? 'Active' : 'Inactive'}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{cycle.cycleName}</h3>
            <p className="text-slate-400 text-xs mb-6 font-medium uppercase tracking-wider">{cycle.evaluationPeriod}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start
                </span>
                <span className="font-bold text-slate-700">{safeFormatDate(cycle.startDate)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" /> End
                </span>
                <span className="font-bold text-slate-700">{safeFormatDate(cycle.endDate)}</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <span className="text-indigo-600 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Cycle Forms <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No appraisal cycles created.</p>
            <button 
              onClick={() => navigate('/appraisal/create-cycle')}
              className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
            >
              + Create your first cycle
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderForms = () => {
    // Group forms by cycle name
    const groupedForms: Record<string, any[]> = {};
    
    // Ensure all cycles appear even if they have no forms
    cycles.forEach((c: any) => {
      groupedForms[c.cycleName] = [];
    });
    
    forms.forEach((form: any) => {
      const key = form.cycleName || 'Unassigned';
      if (!groupedForms[key]) groupedForms[key] = [];
      groupedForms[key].push(form);
    });

    if (expandedCycle) {
      const cycleForms = groupedForms[expandedCycle] || [];
      const cycleData = cycles.find((c: any) => c.cycleName === expandedCycle);

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setExpandedCycle(null)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{expandedCycle}</h2>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Evaluation Templates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['MANAGER_EVALUATION', 'SELF_ASSESSMENT'].map((type) => {
              const form = cycleForms.find((f: any) => {
                const fType = f.formType?.toString().toUpperCase().replace(/[\s_]/g, '');
                const targetType = type.toUpperCase().replace(/[\s_]/g, '');
                return fType === targetType;
              });

              return (
                <div 
                  key={type}
                  className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${type === 'MANAGER_EVALUATION' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${type === 'MANAGER_EVALUATION' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {type.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-800 mb-2">
                    {form ? form.formName : `${type === 'MANAGER_EVALUATION' ? 'Manager Evaluation' : 'Self Assessment'} Form`}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    {form ? (
                      <button 
                        onClick={() => navigate(`/appraisal/forms/${form.formId}`)}
                        className="w-full py-3 bg-slate-50 text-slate-700 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        View Template <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate(`/appraisal/design-form?cycleId=${cycleData?.cycleId}&type=${type}`)}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                      >
                        <Plus className="w-4 h-4" /> Design Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(groupedForms).map((cycleName) => (
          <div 
            key={cycleName}
            onClick={() => setExpandedCycle(cycleName)}
            className="group bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer text-center"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{cycleName}</h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.1em] mb-6">
              {groupedForms[cycleName].length} Form(s) Created
            </p>
            <div className="pt-6 border-t border-slate-50 text-indigo-600 font-bold text-xs flex items-center justify-center gap-1">
              Manage Forms <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Appraisal Hub</h1>
            </div>
            <p className="text-slate-500 font-medium">Manage performance cycles, design templates, and track progress.</p>
          </div>
          
          {isPrivileged && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/appraisal/create-cycle')}
                className="px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl hover:bg-slate-50 border border-slate-200 shadow-sm transition-all flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-indigo-500" /> New Cycle
              </button>
              <button 
                onClick={() => navigate('/appraisal/assign')}
                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Bulk Assign
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {isPrivileged && (
          <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-2xl mb-8 w-fit">
            <button 
              onClick={() => setActiveTab('appraisals')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'appraisals' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              My Assessments
            </button>
            <button 
              onClick={() => setActiveTab('cycles')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'cycles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cycles
            </button>
            <button 
              onClick={() => setActiveTab('forms')}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'forms' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Form Templates
            </button>
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
