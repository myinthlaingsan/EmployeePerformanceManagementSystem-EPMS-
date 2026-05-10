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
  FileText,
  User,
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Cycle List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Past Cycles</h2>
          <div className="space-y-3">
            {goalSets.map((gs) => (
              <button
                key={gs.id}
                onClick={() => setSelectedGoalSetId(gs.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${selectedGoalSetId === gs.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-[1.02]'
                    : 'bg-white border-gray-100 text-gray-900 hover:border-blue-200 hover:shadow-md'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${selectedGoalSetId === gs.id ? 'text-blue-100' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold">{gs.appraisalCycleName || 'Annual Cycle'}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${selectedGoalSetId === gs.id ? 'bg-blue-500/50 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {gs.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${selectedGoalSetId === gs.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {gs.items?.length || 0} Objectives
                  </p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3 h-3 ${selectedGoalSetId === gs.id ? 'text-blue-100' : 'text-emerald-500'}`} />
                    <span className="text-sm font-black">
                      {calculateGoalSetMetrics(gs).finalScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {goalSets.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No history found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details & Audit Trail */}
        <div className="lg:col-span-8">
          {selectedGoalSetId ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Score</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900">{metrics?.finalScore.toFixed(1)}%</span>
                    <span className="text-xs text-emerald-500 font-bold mb-1.5 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      Achievement
                    </span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Completion Rate</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900">{metrics?.completionRate.toFixed(1)}%</span>
                    <span className="text-xs text-blue-500 font-bold mb-1.5">Goals Met</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedGoalSet?.status}</span>
                  </div>
                </div>
              </div>

              {/* Objectives List */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900">Assigned Objectives</h3>
                  <Target className="w-5 h-5 text-gray-400" />
                </div>
                <div className="divide-y divide-gray-50">
                  {selectedGoalSet?.items?.map((item) => (
                    <div key={item.id} className="px-8 py-5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                          <p className="text-xs text-gray-500 font-medium">Weight: {item.weightPercent}% • Target: {item.targetValue} {item.unit}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-gray-900">{item.currentProgress} {item.unit}</span>
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">
                            {Math.min(((item.currentProgress || 0) / (item.targetValue || 1)) * 100, 100).toFixed(0)}% Done
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(((item.currentProgress || 0) / (item.targetValue || 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Trail (The Journey) */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-1">Goal Audit Trail</h3>
                <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pb-4">
                  {auditLoading ? (
                    <div className="pl-8 py-4 text-gray-400 text-xs font-bold animate-pulse">Loading journey logs...</div>
                  ) : auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-8 group">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                      <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white border border-gray-200 rounded-md text-gray-600">
                              {log.action}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {format(new Date(log.createdAt), 'MMM d, yyyy • p')}
                            </span>
                          </div>
                          <User className="w-3 h-3 text-gray-300" />
                        </div>

                        {log.changeDetails && (
                          <div className="flex items-center gap-3 mb-3 bg-white p-2.5 rounded-xl border border-gray-100/50">
                            <div className="flex-1 text-center">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Details</p>
                              <p className="text-xs font-bold text-gray-700">{log.changeDetails}</p>
                            </div>
                          </div>
                        )}

                        {log.changeReason && (
                          <div className="flex gap-2">
                            <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5" />
                            <p className="text-xs text-gray-600 italic leading-relaxed">"{log.changeReason}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {auditLogs.length === 0 && !auditLoading && (
                    <div className="pl-8 py-4">
                      <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-gray-300" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No detailed logs for this cycle</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 space-y-4">
              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-sm text-gray-200">
                <FileText className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-black uppercase tracking-widest">Select a cycle to view history</p>
                <p className="text-xs text-gray-400 mt-1">Detailed performance audit logs will appear here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeKpiHistory;
