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
    <div className="min-h-screen pb-20" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/appraisal/${id}`)}
              className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all border border-slate-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Performance Report</h1>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-10 space-y-8">

        {/* Main Score Banner */}
        <div className="bg-white rounded-[3rem] p-12 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <Award className="w-6 h-6 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Official Rating</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Cycle: <span className="text-indigo-600 italic uppercase">{appraisal.cycleName}</span>
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-6 text-slate-500 font-bold text-sm">
              <div className="flex items-center gap-2"><User className="w-4 h-4" /> {appraisal.employeeName}</div>
              <div className="flex items-center gap-2"><Target className="w-4 h-4" /> {appraisal.employeeCode}</div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 px-16 py-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 shadow-inner group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Overall Performance Index</span>
            <span className={`text-8xl font-black tracking-tighter ${getScoreColor(appraisal.finalScore || 0)} drop-shadow-sm transition-all group-hover:scale-105 duration-500`}>
              {appraisal.finalScore !== null ? Number(appraisal.finalScore).toFixed(1) : '--'}
            </span>
            <div className="h-2 w-40 bg-slate-200 rounded-full overflow-hidden mt-2 p-[2px]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                style={{ width: `${appraisal.finalScore || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

      {/* Comments Section - Only HR Approval now */}
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_30px_70px_rgba(0,0,0,0.06)] transition-all duration-500">
            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Administrative Verification</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Human Resources Final Approval</p>
              </div>
            </div>
            <p className="text-base text-slate-600 leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50 shadow-inner">
              {appraisal.approvalComment || 'The appraisal results have been verified and approved by the HR department. All performance metrics and weightages have been audited for compliance with organizational standards.'}
            </p>
            <div className="mt-6 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Verified & Sealed
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" /> Approved on {appraisal.hrApprovedAt ? format(new Date(appraisal.hrApprovedAt), 'MMMM dd, yyyy') : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown Table */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-[0_30px_60px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Weighted Score Breakdown</h3>
            </div>
            {breakdown?.finalGrade && (
              <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">
                Grade: {breakdown.finalGrade.replace(/_/g, ' ')}
              </div>
            )}
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-4">Performance Category</th>
                  <th className="px-8 py-4 text-center">Raw Score (1-5)</th>
                  <th className="px-8 py-4 text-center">Weightage</th>
                  <th className="px-8 py-4 text-right">Weighted Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { label: 'Key Performance Indicators (KPIs)', raw: breakdown?.kpiRawScore, weight: breakdown?.kpiWeight, weighted: breakdown?.kpiWeightedScore, color: 'text-blue-600' },
                  { label: 'Manager Evaluation', raw: breakdown?.managerRawScore, weight: breakdown?.managerWeight, weighted: breakdown?.managerWeightedScore, color: 'text-indigo-600' },
                  { label: 'Self Assessment Reflection', raw: breakdown?.selfRawScore, weight: breakdown?.selfWeight, weighted: breakdown?.selfWeightedScore, color: 'text-purple-600' },
                  { label: '360° Peer Feedback', raw: breakdown?.feedbackRawScore, weight: breakdown?.feedbackWeight, weighted: breakdown?.feedbackWeightedScore, color: 'text-emerald-600' },
                ].map((row, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-700">{row.label}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600">
                        {row.raw !== undefined ? Number(row.raw).toFixed(2) : '--'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center text-xs font-bold text-slate-400">
                      {row.weight !== undefined ? `${(Number(row.weight) * 100).toFixed(0)}%` : '--'}
                    </td>
                    <td className={`px-8 py-5 text-right text-sm font-black ${row.color}`}>
                      {row.weighted !== undefined ? Number(row.weighted).toFixed(2) : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white">
                  <td colSpan={3} className="px-8 py-6 text-sm font-black uppercase tracking-widest">Calculated Performance Total (Weighted Sum)</td>
                  <td className="px-8 py-6 text-right text-2xl font-black italic">
                    {breakdown?.finalTotalScore !== undefined ? Number(breakdown.finalTotalScore).toFixed(2) : '--'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Formal Sign-off Section */}
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-[0_30px_60px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Formal Acknowledgement</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Authentication & Signatures</p>
              </div>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Employee Signature */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee Acknowledgement</p>
                  <h4 className="text-base font-black text-slate-900">{appraisal.employeeName}</h4>
                </div>
                {appraisal.employeeSignedAt && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Signed
                  </div>
                )}
              </div>

              <div className="h-48 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative group overflow-hidden">
                {appraisal.employeeSignComment ? (
                  <img
                    src={`http://localhost:8080${appraisal.employeeSignComment}`}
                    alt="Employee Signature"
                    className="max-h-32 object-contain mix-blend-multiply transition-all group-hover:scale-105"
                  />
                ) : employeeSigPreview ? (
                  <img src={employeeSigPreview} alt="Preview" className="max-h-32 object-contain mix-blend-multiply" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-slate-300 mb-2 group-hover:text-indigo-400 transition-all" />
                    <p className="text-xs font-bold text-slate-400">Click to upload signature</p>
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
                  </>
                )}
              </div>

              {isEmployee && !appraisal.employeeSignedAt && (
                <button
                  disabled={!employeeSigFile || isSigningEmployee}
                  onClick={handleEmployeeSign}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSigningEmployee ? 'Uploading...' : 'I Acknowledge & Sign'} <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {appraisal.employeeSignedAt && (
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  Signed on {format(new Date(appraisal.employeeSignedAt), 'MMMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>

            {/* Manager Signature */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Appraiser Sign-off</p>
                  <h4 className="text-base font-black text-slate-900">{appraisal.managerName || 'Evaluator'}</h4>
                </div>
                {appraisal.managerSignedAt && (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3" /> Signed
                  </div>
                )}
              </div>

              <div className="h-48 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative group overflow-hidden">
                {appraisal.managerSignComment ? (
                  <img
                    src={`http://localhost:8080${appraisal.managerSignComment}`}
                    alt="Manager Signature"
                    className="max-h-32 object-contain mix-blend-multiply transition-all group-hover:scale-105"
                  />
                ) : managerSigPreview ? (
                  <img src={managerSigPreview} alt="Preview" className="max-h-32 object-contain mix-blend-multiply" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10 text-slate-300 mb-2 group-hover:text-indigo-400 transition-all" />
                    <p className="text-xs font-bold text-slate-400">Click to upload signature</p>
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
                  </>
                )}
              </div>

              {(isManager || isPrivileged) && !appraisal.managerSignedAt && (
                <div className="space-y-4">
                  {!appraisal.employeeSignedAt && (
                    <div className="p-4 bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 rounded-xl animate-pulse">
                      <Target className="w-4 h-4" /> Sequential Sign-off: Awaiting employee signature
                    </div>
                  )}
                  <button
                    disabled={!managerSigFile || isSigningManager || !appraisal.employeeSignedAt}
                    onClick={handleManagerSign}
                    className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-1 active:translate-y-0"
                  >
                    {isSigningManager ? 'Processing...' : 'Authorize Final Record'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {appraisal.managerSignedAt && (
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  Signed on {format(new Date(appraisal.managerSignedAt), 'MMMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 flex items-start gap-4 shadow-sm shadow-amber-50">
          <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
          <p className="text-xs font-medium text-amber-700 leading-relaxed">
            By providing your digital signature, you acknowledge that you have reviewed the performance results for this cycle.
            This document will be permanently stored in your employment records and can be exported as a PDF for personal filing.
          </p>
        </div>

      </div>
    </div>
  );
};

export default ResultPage;
