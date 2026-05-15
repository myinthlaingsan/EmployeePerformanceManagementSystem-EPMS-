import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetEmployeeAssessmentQuery,
  useCalculateScoreMutation,
  useApproveAppraisalMutation,
  useFinalizeAppraisalMutation
} from '../../features/appraisal/appraisalApi';
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
  ArrowUpRight,
  Lock,
  Calculator,
  ShieldCheck,
  Flag,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AppraisalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isHR } = useAuth();

  const { data: appraisal, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });
  const [calculateScore, { isLoading: isCalculating }] = useCalculateScoreMutation();
  const [approveAppraisal, { isLoading: isApproving }] = useApproveAppraisalMutation();
  const [finalizeAppraisal, { isLoading: isFinalizing }] = useFinalizeAppraisalMutation();

  const [approvalComment, setApprovalComment] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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

  const isEmployee = Number(user?.id) === Number(appraisal.employeeId);
  const isManager = Number(user?.id) === Number(appraisal.managerId);
  const isPrivileged = isAdmin || isHR;

  // HR/Admin can only view if submitted, unless they are the direct manager/employee
  // HR/Admin can view any self-assessment to monitor progress or test
  const canViewSelfAssessment = isEmployee || isManager || isPrivileged;
  const canViewManagerEvaluation = isManager || isPrivileged || (isEmployee && !!appraisal.managerSubmittedAt);

  const handleCalculate = async () => {
    try {
      await calculateScore(id!).unwrap();
      toast.success('Scores calculated successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Calculation failed');
    }
  };

  const handleApprove = async () => {
    try {
      await approveAppraisal({ id: id!, comment: approvalComment }).unwrap();
      toast.success('Appraisal approved by HR!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Approval failed');
    }
  };

  const handleFinalize = async () => {
    try {
      await finalizeAppraisal(id!).unwrap();
      toast.success('Appraisal finalized and locked!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Finalization failed');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Pending Self Assessment', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock };
      case 'SELF_ASSESSED': return { label: 'Awaiting Manager Review', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: UserCheck };
      case 'EVALUATED': return { label: 'Ready for HR Calculation', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Calculator };
      case 'HR_APPROVED': return { label: 'Awaiting Sign-offs', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: ShieldCheck };
      case 'FINALIZED': return { label: 'Finalized', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 };
      default: return { label: status, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Clock };
    }
  };

  const statusInfo = getStatusInfo(appraisal.status);

  return (
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 60%, #eef2f7 100%)' }}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/appraisal')}
              className="p-2.5 bg-white text-slate-500 rounded-xl hover:bg-slate-50 transition-all active:scale-95 border border-slate-200 shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Appraisal Hub</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-0.5">{appraisal.cycleName}</p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm ${statusInfo.color}`}>
            <statusInfo.icon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pt-8 space-y-8">

        {/* Profile & Score Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center gap-8">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-indigo-200">
              {appraisal.employeeName?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{appraisal.employeeName}</h2>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black tracking-widest uppercase">{appraisal.employeeCode}</span>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                  <Target className="w-4 h-4 text-indigo-400" /> {appraisal.positionName || 'Associate'}
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                  <User className="w-4 h-4 text-indigo-400" /> Manager: <span className="text-slate-600">{appraisal.managerName || 'Pending'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                  <Calendar className="w-4 h-4 text-indigo-400" /> {appraisal.assignedAt ? format(new Date(appraisal.assignedAt), 'MMM dd, yyyy') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Current Performance Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter">
                {appraisal.finalScore !== null ? Number(appraisal.finalScore).toFixed(1) : '--'}
              </span>
              <span className="text-indigo-300 font-bold text-lg">/ 100</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-indigo-400 to-blue-400 transition-all duration-1000"
                  style={{ width: `${appraisal.finalScore || 0}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-black text-indigo-300">{Math.round(appraisal.finalScore || 0)}%</span>
            </div>
          </div>
        </div>

        {/* Action Center for Privileged Users */}
        {isPrivileged && (
          <div className="bg-white rounded-4xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> HR Administrator Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Calculate Score */}
              <div className={`p-6 rounded-2xl border transition-all ${appraisal.status === 'EVALUATED' ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Calculator className="w-6 h-6" />
                  </div>
                  {appraisal.status !== 'PENDING' && appraisal.status !== 'SELF_ASSESSED' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Score Calculation</h4>
                <p className="text-[11px] text-slate-400 font-medium mb-4">Process all form ratings into the final weighted score.</p>
                <button
                  disabled={isCalculating || (appraisal.status !== 'EVALUATED' && appraisal.status !== 'HR_APPROVED')}
                  onClick={handleCalculate}
                  className="w-full py-2.5 bg-white border border-indigo-200 text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isCalculating ? 'Processing...' : 'Run Calculation'}
                </button>
              </div>

              {/* Approve Appraisal */}
              <div className={`p-6 rounded-2xl border transition-all ${appraisal.status === 'EVALUATED' || appraisal.status === 'HR_APPROVED' ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  {appraisal.status === 'HR_APPROVED' || appraisal.status === 'FINALIZED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : null}
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">HR Approval</h4>
                <p className="text-[11px] text-slate-400 font-medium mb-4">Review results and approve for final sign-off.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Approval comment..."
                    className="w-full px-3 py-2 bg-white border border-purple-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    disabled={appraisal.status !== 'EVALUATED'}
                  />
                  <button
                    disabled={isApproving || appraisal.status !== 'EVALUATED'}
                    onClick={handleApprove}
                    className="w-full py-2.5 bg-white border border-purple-200 text-purple-600 text-xs font-black rounded-xl hover:bg-purple-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isApproving ? 'Approving...' : 'Approve Results'}
                  </button>
                </div>
              </div>

              {/* Finalize Appraisal */}
              <div className={`p-6 rounded-2xl border transition-all ${appraisal.status === 'HR_APPROVED' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-slate-50/50 opacity-60'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                    <Flag className="w-6 h-6" />
                  </div>
                  {appraisal.status === 'FINALIZED' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Finalize & Lock</h4>
                <p className="text-[11px] text-slate-400 font-medium mb-4">Complete the cycle and archive the record.</p>
                <button
                  disabled={isFinalizing || appraisal.status !== 'HR_APPROVED'}
                  onClick={handleFinalize}
                  className="w-full py-2.5 bg-white border border-emerald-200 text-emerald-600 text-xs font-black rounded-xl hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
                >
                  {isFinalizing ? 'Finalizing...' : 'Close Appraisal'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results & Sign-off Banner */}
        {(appraisal.status === 'HR_APPROVED' || appraisal.status === 'FINALIZED') && (
          <div
            onClick={() => navigate(`/appraisal/${id}/results`)}
            className="bg-linear-to-r from-indigo-600 to-indigo-800 rounded-4xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Final Results & Formal Sign-off</h3>
                <p className="text-indigo-200 text-sm font-medium">
                  {appraisal.status === 'FINALIZED'
                    ? 'The appraisal process is complete. View the final signed report.'
                    : 'HR has approved the results. Review the performance summary and provide your digital signature.'}
                </p>
              </div>
            </div>
            <div className="px-8 py-3 bg-white text-indigo-700 font-black rounded-xl shadow-lg flex items-center gap-2 group-hover:gap-4 transition-all">
              {appraisal.status === 'FINALIZED' ? 'View Final Report' : 'Proceed to Sign-off'}
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Form Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Manager Evaluation Card */}
          {canViewManagerEvaluation ? (
            <div
              onClick={() => navigate(`/appraisal/${id}/manager-evaluation`)}
              className="group bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-5 rounded-3xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                  <FileText className="w-8 h-8" />
                </div>
                {appraisal.managerSubmittedAt ? (
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Completed
                  </div>
                ) : (
                  <div className="px-4 py-1.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
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
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                  {appraisal.managerSubmittedAt ? 'View Evaluation' : (isManager ? 'Start Evaluating' : 'View Progress')}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-2 shadow-sm">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center opacity-60 relative overflow-hidden">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Evaluation Locked</h3>
              <p className="text-slate-400 font-medium max-w-70">
                {isPrivileged ? "Only submitted evaluations can be reviewed by HR." : "The manager evaluation will be available once submitted."}
              </p>
            </div>
          )}

          {/* Self Assessment Card */}
          {canViewSelfAssessment ? (
            <div
              onClick={() => navigate(`/appraisal/${id}/self-assessment`)}
              className="group bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 -mr-10 -mt-10 rounded-full bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity blur-3xl"></div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="p-5 rounded-3xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <ClipboardList className="w-8 h-8" />
                </div>
                {appraisal.selfSubmittedAt ? (
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Submitted
                  </div>
                ) : (
                  <div className="px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
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
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                  {appraisal.selfSubmittedAt ? 'View Assessment' : (isEmployee ? 'Continue Assessment' : 'View Progress')}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-2 shadow-sm">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-200 border-dashed flex flex-col items-center justify-center text-center opacity-60 relative overflow-hidden">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-sm">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">Self Assessment Locked</h3>
              <p className="text-slate-400 font-medium max-w-70">
                {isPrivileged ? "Only submitted assessments can be reviewed by HR." : "You can view the employee's assessment once it has been submitted."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppraisalDetail;
