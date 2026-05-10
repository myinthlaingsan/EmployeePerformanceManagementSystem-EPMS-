import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEmployeeKpiHistoryQuery, useGetGoalSetAuditTrailQuery } from '../../services/kpiApi';
import {
  ChevronLeft,
  Calendar,
  Target,
  TrendingUp,
  Clock,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { calculateGoalSetMetrics } from '../../utils/kpiTransformationService';

const EmployeeKpiHistory: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [selectedGoalSetId, setSelectedGoalSetId] = useState<number | null>(null);

  const { data: historyResponse, isLoading: historyLoading } = useGetEmployeeKpiHistoryQuery(Number(employeeId));
  const { data: auditResponse, isLoading: auditLoading } = useGetGoalSetAuditTrailQuery(selectedGoalSetId || 0, {
    skip: !selectedGoalSetId
  });

  const goalSets = historyResponse?.data || [];
  const auditLogs = auditResponse?.data || [];

  const selectedGoalSet = goalSets.find(gs => gs.id === selectedGoalSetId);
  const metrics = selectedGoalSet ? calculateGoalSetMetrics(selectedGoalSet) : null;

  if (historyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">KPI Performance History</h1>
            <p className="text-gray-500 font-medium">Review past performance cycles and goal audit logs.</p>
          </div>
        </div>
      </header>

      {/* Cycle Selector (Modern Horizontal Timeline) */}
      <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 no-scrollbar scroll-smooth">
          {goalSets.map((gs) => (
            <button
              key={gs.id}
              onClick={() => setSelectedGoalSetId(gs.id)}
              className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border ${selectedGoalSetId === gs.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]'
                  : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Calendar className={`w-5 h-5 ${selectedGoalSetId === gs.id ? 'text-blue-100' : 'text-gray-400'}`} />
              <div className="text-left pr-4">
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedGoalSetId === gs.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {gs.status}
                </p>
                <p className="text-sm font-bold whitespace-nowrap">
                  {gs.appraisalCycleName || 'Annual Cycle'}
                </p>
              </div>
              <div className={`h-8 w-[1px] ${selectedGoalSetId === gs.id ? 'bg-blue-400' : 'bg-gray-100'}`} />
              <div className="text-right pl-2">
                <p className="text-lg font-black leading-none">
                  {calculateGoalSetMetrics(gs).finalScore.toFixed(0)}%
                </p>
                <p className={`text-[10px] font-medium ${selectedGoalSetId === gs.id ? 'text-blue-200' : 'text-emerald-500'}`}>Score</p>
              </div>
            </button>
          ))}

          {goalSets.length === 0 && (
            <div className="flex items-center gap-3 px-8 py-4 text-gray-400 italic">
              <AlertCircle className="w-5 h-5" />
              <span>No historical cycles found for this employee.</span>
            </div>
          )}
        </div>
      </div>

      {selectedGoalSet ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Detailed Statistics */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-24 h-24 text-blue-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cycle Performance Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">{metrics?.finalScore.toFixed(1)}%</span>
                <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Target Met</div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Target className="w-24 h-24 text-indigo-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Goal Completion Rate</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">{metrics?.completionRate.toFixed(1)}%</span>
                <span className="text-gray-400 font-bold text-sm">/ 100%</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Clock className="w-24 h-24 text-purple-600" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cycle Status</p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-4xl font-black text-gray-900 uppercase tracking-tight">{selectedGoalSet.status}</span>
              </div>
            </div>
          </div>

          {/* Content Grid: Objectives & Audit Trail */}
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Objectives Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Assigned Objectives</h3>
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {selectedGoalSet?.items?.map((item) => (
                    <div key={item.id} className="px-8 py-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{item.title}</h4>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Weight: {item.weightPercent}%</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-gray-900">{item.currentProgress} <span className="text-[10px] text-gray-400 font-bold uppercase">{item.unit}</span></span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-blue-600">{Math.min(((item.currentProgress || 0) / (item.targetValue || 1)) * 100, 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                            style={{ width: `${Math.min(((item.currentProgress || 0) / (item.targetValue || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Trail Column */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Goal Journey</h3>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-full">
                <div className="relative border-l-2 border-blue-50 ml-2 space-y-8 pb-4">
                  {auditLoading ? (
                    <div className="pl-8 py-4 space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="relative pl-8 group">
                        <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-lg group-hover:scale-125 transition-transform" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              log.action === 'PROGRESS_UPDATE' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : log.action.includes('ITEM') 
                                  ? 'bg-indigo-50 text-indigo-600'
                                  : 'bg-blue-50 text-blue-600'
                            }`}>
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          {log.changeDetails && (
                            <p className="text-sm font-bold text-gray-700 leading-snug">{log.changeDetails}</p>
                          )}
                          {log.changeReason && (
                            <div className="flex gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-600 italic">"{log.changeReason}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {auditLogs.length === 0 && !auditLoading && (
                    <div className="pl-8 py-4 flex flex-col items-center justify-center text-center space-y-3">
                      <Clock className="w-12 h-12 text-gray-100" />
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No history logs available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-gray-100 shadow-sm space-y-6 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600">
            <Target className="w-12 h-12" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Select a Cycle</h3>
            <p className="text-gray-500 max-w-xs mx-auto">Pick a performance cycle from the timeline above to explore detailed scores and history.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeKpiHistory;
