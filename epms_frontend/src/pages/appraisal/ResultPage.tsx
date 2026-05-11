import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetEmployeeAssessmentQuery, 
  useUploadEmployeeSignatureMutation,
  useUploadManagerSignatureMutation,
  useGetScoreBreakdownQuery
} from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';
import { 
  ChevronLeft, 
  Award, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  MessageSquare,
  Image as ImageIcon,
  ArrowRight,
  Download,
  Target,
  Clock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isHR, isAdmin } = useAuth();

  const { data: appraisal, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });
  const { data: breakdown } = useGetScoreBreakdownQuery(id || '', { skip: !id });
  const [uploadEmployeeSignature, { isLoading: isSigningEmployee }] = useUploadEmployeeSignatureMutation();
  const [uploadManagerSignature, { isLoading: isSigningManager }] = useUploadManagerSignatureMutation();

  const [employeeSigFile, setEmployeeSigFile] = useState<File | null>(null);
  const [employeeSigPreview, setEmployeeSigPreview] = useState<string | null>(null);
  const [managerSigFile, setManagerSigFile] = useState<File | null>(null);
  const [managerSigPreview, setManagerSigPreview] = useState<string | null>(null);

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
        Results not found.
      </div>
    );
  }

  const isEmployee = user?.id === appraisal.employeeId;
  const isManager = user?.id === appraisal.managerId;
  const isPrivileged = isHR || isAdmin;

  const handleEmployeeSign = async () => {
    if (!employeeSigFile) return;
    try {
      await uploadEmployeeSignature({ id: id!, file: employeeSigFile }).unwrap();
      alert('Sign-off successful!');
      setEmployeeSigFile(null);
      setEmployeeSigPreview(null);
    } catch (err: any) {
      alert(err?.data?.message || 'Upload failed');
    }
  };

  const handleManagerSign = async () => {
    if (!managerSigFile) return;
    try {
      await uploadManagerSignature({ id: id!, file: managerSigFile }).unwrap();
      alert('Manager sign-off successful!');
      setManagerSigFile(null);
      setManagerSigPreview(null);
    } catch (err: any) {
      alert(err?.data?.message || 'Upload failed');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 80) return 'text-blue-500';
    if (score >= 60) return 'text-indigo-500';
    return 'text-amber-500';
  };

  return (
    <div className="min-h-screen pb-20 bg-[#FBFBFB]">
      {/* Header - Minimalist & Elegant */}
      <div className="bg-white border-b border-slate-200 px-12 py-6 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate(`/appraisal/${id}`)} 
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-[0.2em] uppercase">Performance Review</h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">Confidential Personnel Record</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">
              <Download className="w-4 h-4" /> Print Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-12 pt-12 space-y-12">
        
        {/* Document Metadata & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em]">
                <ShieldCheck className="w-4 h-4" /> Final Assessment Verified
              </div>
              <h2 className="text-5xl font-light text-slate-900 tracking-tight leading-tight">
                Individual Performance Summary: <span className="font-semibold block">{appraisal.cycleName}</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-10 py-8 border-t border-b border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subject Name</p>
                <p className="text-lg font-semibold text-slate-800">{appraisal.employeeName}</p>
                <p className="text-sm text-slate-500 mt-1">{appraisal.employeeCode}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assessing Manager</p>
                <p className="text-lg font-semibold text-slate-800">{appraisal.managerName || 'Not Assigned'}</p>
                <p className="text-sm text-slate-500 mt-1">Reviewing Authority</p>
              </div>
            </div>
          </div>

          {/* Final Score Card - Elegant Slate/Gold-ish feel */}
          <div className="bg-slate-900 p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award className="w-24 h-24" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Performance Rating</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-bold tracking-tighter">
                {appraisal.finalScore !== null ? Number(appraisal.finalScore).toFixed(1) : '--'}
              </span>
              <span className="text-slate-500 font-medium text-lg">/ 100</span>
            </div>
            <div className="mt-8 space-y-4">
              <div className="h-1 bg-slate-800 w-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: `${appraisal.finalScore || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Standing</span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                  {breakhead?.finalGrade?.replace(/_/g, ' ') || 'Calculating...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Management Review</h3>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="bg-white p-8 border border-slate-200 shadow-sm min-h-[160px]">
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{appraisal.managerEvaluation?.finalComment || 'No additional executive remarks provided for this review period.'}"
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Compliance & Audit</h3>
              <div className="h-[1px] flex-1 bg-slate-100"></div>
            </div>
            <div className="bg-slate-50 p-8 border border-slate-200 shadow-sm min-h-[160px]">
              <p className="text-sm text-slate-500 leading-relaxed">
                {appraisal.approvalComment || 'This appraisal document has been audited for compliance with organizational standards and verified by the Human Resources department.'}
              </p>
              {appraisal.hrApprovedAt && (
                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5" /> Verified: {format(new Date(appraisal.hrApprovedAt), 'MMMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Table - Clean Professional Style */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Quantitative Breakdown</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>
          
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metric Component</th>
                  <th className="px-10 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Raw</th>
                  <th className="px-10 py-5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</th>
                  <th className="px-10 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: 'Key Performance Indicators', raw: breakdown?.kpiRawScore, weight: breakdown?.kpiWeight, weighted: breakdown?.kpiWeightedScore },
                  { label: 'Management Evaluation', raw: breakdown?.managerRawScore, weight: breakdown?.managerWeight, weighted: breakdown?.managerWeightedScore },
                  { label: 'Self-Assessment Reflection', raw: breakdown?.selfRawScore, weight: breakdown?.selfWeight, weighted: breakdown?.selfWeightedScore },
                  { label: '360° Peer Review', raw: breakdown?.feedbackRawScore, weight: breakdown?.feedbackWeight, weighted: breakdown?.feedbackWeightedScore },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-10 py-6 text-sm font-semibold text-slate-700">{row.label}</td>
                    <td className="px-10 py-6 text-center text-sm font-medium text-slate-500">
                      {row.raw !== undefined ? Number(row.raw).toFixed(2) : '--'}
                    </td>
                    <td className="px-10 py-6 text-center text-[11px] font-bold text-slate-400">
                      {row.weight !== undefined ? `${(Number(row.weight) * 100).toFixed(0)}%` : '--'}
                    </td>
                    <td className="px-10 py-6 text-right text-sm font-bold text-slate-900">
                      {row.weighted !== undefined ? Number(row.weighted).toFixed(2) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={3} className="px-10 py-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Calculated Weighted Score</td>
                  <td className="px-10 py-6 text-right text-xl font-bold text-slate-900">
                    {breakdown?.finalTotalScore !== undefined ? Number(breakdown.finalTotalScore).toFixed(2) : '--'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Signatures - Clean Boxed Design */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em]">Authentication</h3>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Employee Signature */}
            <div className="p-10 border border-slate-200 bg-white space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{appraisal.employeeName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Employee Signature</p>
                </div>
                {appraisal.employeeSignedAt && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              <div className="h-40 border border-slate-100 bg-[#F9F9F9] flex items-center justify-center relative">
                {appraisal.employeeSignComment ? (
                  <img src={`http://localhost:8080${appraisal.employeeSignComment}`} alt="Signature" className="max-h-24 object-contain grayscale contrast-125" />
                ) : employeeSigPreview ? (
                  <img src={employeeSigPreview} alt="Preview" className="max-h-24 object-contain grayscale contrast-125" />
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pending Acknowledgement</p>
                    {isEmployee && (
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setEmployeeSigFile(file); setEmployeeSigPreview(URL.createObjectURL(file)); }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {isEmployee && !appraisal.employeeSignedAt && (
                <button 
                  disabled={!employeeSigFile || isSigningEmployee}
                  onClick={handleEmployeeSign}
                  className="w-full py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  {isSigningEmployee ? 'Processing...' : 'Acknowledge Results'}
                </button>
              )}
              {appraisal.employeeSignedAt && (
                <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  Signed: {format(new Date(appraisal.employeeSignedAt), 'yyyy-MM-dd HH:mm')}
                </p>
              )}
            </div>

            {/* Manager Signature */}
            <div className="p-10 border border-slate-200 bg-white space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{appraisal.managerName || 'Assessing Authority'}</h4>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">Manager Sign-off</p>
                </div>
                {appraisal.managerSignedAt && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>

              <div className="h-40 border border-slate-100 bg-[#F9F9F9] flex items-center justify-center relative">
                {appraisal.managerSignComment ? (
                  <img src={`http://localhost:8080${appraisal.managerSignComment}`} alt="Signature" className="max-h-24 object-contain grayscale contrast-125" />
                ) : managerSigPreview ? (
                  <img src={managerSigPreview} alt="Preview" className="max-h-24 object-contain grayscale contrast-125" />
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pending Authorization</p>
                    {isManager && (
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setManagerSigFile(file); setManagerSigPreview(URL.createObjectURL(file)); }
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              {(isManager || isPrivileged) && !appraisal.managerSignedAt && (
                <button 
                  disabled={!managerSigFile || isSigningManager}
                  onClick={handleManagerSign}
                  className="w-full py-4 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-30"
                >
                  {isSigningManager ? 'Processing...' : 'Authorize Final Record'}
                </button>
              )}
              {appraisal.managerSignedAt && (
                <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  Authorized: {format(new Date(appraisal.managerSignedAt), 'yyyy-MM-dd HH:mm')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-12 border-t border-slate-200">
          <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-center max-w-3xl mx-auto uppercase tracking-widest">
            This performance evaluation is a formal record of employment. Information contained herein is confidential and intended solely for the use of the subject, their management chain, and the Human Resources department. Any unauthorized distribution or reproduction is strictly prohibited.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResultPage;
