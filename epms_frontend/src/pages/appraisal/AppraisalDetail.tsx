import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEmployeeAssessmentQuery } from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';
import { 
  ClipboardList, 
  FileText, 
  ChevronLeft, 
  User, 
  CheckCircle2, 
  Clock, 
  Target, 
  ArrowRight,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AppraisalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: appraisal, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!appraisal) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100 max-w-2xl mx-auto mt-20">
        Appraisal not found.
      </div>
    );
  }

  const isEmployee = user?.id === appraisal.employeeId;
  const isManager = user?.id === appraisal.managerId;
  const canViewSelfAssessment = isEmployee || appraisal.selfSubmittedAt;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/appraisal')} 
              className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Appraisal Overview</h1>
              <p className="text-slate-500 text-xs font-medium mt-0.5">{appraisal.cycleName}</p>
            </div>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 
            ${appraisal.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${appraisal.status === 'FINALIZED' ? 'bg-emerald-600' : 'bg-indigo-600 animate-pulse'}`}></div>
            {appraisal.status.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pt-10">
        {/* Employee Profile Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 mb-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-3xl shadow-inner border border-indigo-100">
            {appraisal.employeeName?.charAt(0)}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{appraisal.employeeName}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Target className="w-4 h-4" /> {appraisal.employeeCode}
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <User className="w-4 h-4" /> Assigned to {appraisal.managerName || 'System'}
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                <Clock className="w-4 h-4" /> Created {appraisal.assignedAt ? format(new Date(appraisal.assignedAt), 'MMM dd, yyyy') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Manager Evaluation Card */}
          <div 
            onClick={() => navigate(`/appraisal/${id}/manager-evaluation`)}
            className="group bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden h-full"
          >
            <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="p-5 rounded-3xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FileText className="w-8 h-8" />
              </div>
              {appraisal.managerSubmittedAt ? (
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Completed
                </div>
              ) : (
                <div className="px-4 py-1.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {isManager ? 'Action Required' : 'In Progress'}
                </div>
              )}
            </div>

            <div className="flex-1 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">Evaluation Form</h3>
              <p className="text-slate-400 font-medium leading-relaxed mb-10">
                Manager's performance review and objective ratings for the current cycle.
              </p>
            </div>

            <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
              <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                {appraisal.managerSubmittedAt ? 'View Evaluation' : (isManager ? 'Start Evaluating' : 'View Progress')}
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-2">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Self Assessment Card */}
          {canViewSelfAssessment ? (
            <div 
              onClick={() => navigate(`/appraisal/${id}/self-assessment`)}
              className="group bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>
              
              <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="p-5 rounded-3xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <ClipboardList className="w-8 h-8" />
                </div>
                {appraisal.selfSubmittedAt ? (
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Submitted
                  </div>
                ) : (
                  <div className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                    In Progress
                  </div>
                )}
              </div>

              <div className="flex-1 relative z-10">
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">Self Assessment</h3>
                <p className="text-slate-400 font-medium leading-relaxed mb-10">
                  The employee's personal reflection on achievements, challenges, and core values.
                </p>
              </div>

              <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                <span className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  {appraisal.selfSubmittedAt ? 'View Assessment' : 'Continue Assessment'}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-2">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center opacity-60 h-full">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Self Assessment Locked</h3>
              <p className="text-slate-400 font-medium max-w-[280px]">
                You can view the employee's assessment once it has been submitted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppraisalDetail;
