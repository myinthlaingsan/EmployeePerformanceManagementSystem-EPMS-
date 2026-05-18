import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetCyclesQuery } from '../../../features/appraisal/appraisalApi';
import { 
  useGetSummariesByCycleQuery, 
  useFinalizeSummaryMutation,
  useGenerateAllSummariesMutation
} from '../../../features/feedback360/feedback360Api';
import { usePagination } from '../../../hooks/usePagination';
import StatusBadge from '../../../components/shared/StatusBadge';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  Eye, 
  Lock, 
  Unlock,
  Loader2,
  BarChart3
} from 'lucide-react';

const FeedbackSummaryList: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCycleId, setSelectedCycleId] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  
  const paging = usePagination('summaryList');
  const { data: cycles } = useGetCyclesQuery();
  
  const { data: summaries, isLoading } = useGetSummariesByCycleQuery(selectedCycleId || 0, {
    skip: !selectedCycleId
  });

  const [finalize, { isLoading: isFinalizing }] = useFinalizeSummaryMutation();
  const [generateAll, { isLoading: isGenerating }] = useGenerateAllSummariesMutation();

  const filteredSummaries = summaries?.filter(s => 
    s.targetUserName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleFinalize = async (id: number) => {
    if (!window.confirm('Finalizing will lock this report. Continue?')) return;
    try {
      await finalize(id).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedCycleId) return;
    try {
      await generateAll(selectedCycleId).unwrap();
      alert('Summaries generated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to generate summaries. Please check if there are any completed feedbacks.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cycle Results & Finalization</h1>
            <p className="text-slate-500 font-medium text-sm">Monitor completion and publish finalized reports</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <select 
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(Number(e.target.value))}
              className="bg-transparent border-none text-slate-900 font-black focus:ring-0 cursor-pointer text-sm"
            >
              <option value="">Select Appraisal Cycle</option>
              {cycles?.map(c => <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>)}
            </select>
          </div>

          {selectedCycleId && (
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              Generate All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 p-4 rounded-3xl border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search employee name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee & Dept</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progress</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Score</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSummaries.map((s) => (
              <tr key={s.summaryId || s.targetUserId} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                      {s.targetUserName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{s.targetUserName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase tracking-tight">{s.targetJobLevelCode}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.targetDepartmentName}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-black text-slate-700">
                      {s.completedRequests} <span className="text-slate-300">/</span> {s.totalRequests}
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Submitted</div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                      <div 
                        className={`h-full rounded-full ${s.totalAverageScore >= 80 ? 'bg-emerald-500' : s.totalAverageScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                        style={{ width: `${s.totalAverageScore}%` }}
                      />
                    </div>
                    <span className="font-black text-slate-700 text-sm">{s.totalAverageScore.toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <StatusBadge type="status" value={s.isFinalized ? 'LOCKED' : 'DRAFT'} />
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/feedback360/summary/${s.targetUserId}/${selectedCycleId}`)}
                      className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!s.isFinalized ? (
                      <button 
                        onClick={() => s.summaryId && handleFinalize(s.summaryId)}
                        disabled={isFinalizing}
                        className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                        title="Finalize Report"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100" title="Finalized">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredSummaries.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="py-32 text-center">
                  <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No reports found for this selection</p>
                </td>
              </tr>
            )}
            
            {isLoading && (
              <tr>
                <td colSpan={4} className="py-32 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aggregating Global Metrics...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackSummaryList;
