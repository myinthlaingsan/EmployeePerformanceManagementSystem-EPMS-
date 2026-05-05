import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  useGetGoalSetByEmployeeQuery, 
  useUpdateProgressMutation,
  useGetProgressHistoryQuery
} from '../../services/kpiApi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { 
  ChevronRight, 
  History, 
  CheckCircle2, 
  Info,
  ArrowRight,
  TrendingUp,
  Calendar,
  Save,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

const ProgressUpdateWorkspace: React.FC = () => {
  const { user } = useAuth();
  const { activeCycleId, activeCycleName } = useActiveCycle();
  const navigate = useNavigate();

  const { data: goalSetResponse, isLoading: loadingGoals, refetch: refetchGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: user?.id || 0,
    cycleId: activeCycleId
  }, { skip: !user });

  const { data: historyResponse } = useGetProgressHistoryQuery({ 
    employeeId: user?.id || 0,
    limit: 5 
  }, { skip: !user });

  const [updateProgress] = useUpdateProgressMutation();

  const goalSet = goalSetResponse?.data;
  const kpis = goalSet?.items || [];
  const history = historyResponse?.data || [];

  const [formValues, setFormValues] = useState<Record<number, { actualValue: number; evidenceNote: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (kpis.length > 0) {
      const initialValues: Record<number, { actualValue: number; evidenceNote: string }> = {};
      kpis.forEach(item => {
        initialValues[item.id] = {
          actualValue: item.currentProgress || 0,
          evidenceNote: ''
        };
      });
      setFormValues(initialValues);
    }
  }, [kpis]);

  const handleValueChange = (id: number, field: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Find items that actually changed or have notes
      const updates = Object.entries(formValues)
        .filter(([id, values]) => {
          const original = kpis.find(k => k.id === Number(id));
          return values.actualValue !== original?.currentProgress || values.evidenceNote.trim() !== '';
        });

      if (updates.length === 0) {
        alert("No changes detected.");
        setIsSubmitting(false);
        return;
      }

      // Execute updates sequentially or in parallel
      await Promise.all(updates.map(([id, values]) => 
        updateProgress({
          goalItemId: Number(id),
          actualValue: values.actualValue,
          progressPercent: Math.min(Math.round((values.actualValue / (kpis.find(k => k.id === Number(id))?.targetValue || 1)) * 100), 100),
          evidenceNote: values.evidenceNote
        }).unwrap()
      ));

      alert("Progress updated successfully!");
      refetchGoals();
      navigate('/kpi/my');
    } catch (err) {
      console.error('Failed to update progress:', err);
      alert("Failed to update some progress items. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingGoals) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 mb-8 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
            <span>Performance</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">KPI Progress Update</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Update KPI Progress</h1>
              <p className="text-sm text-gray-500 font-medium max-w-xl leading-relaxed">
                Log your current metrics and evidence notes for active performance indicators. 
                This data influences your quarterly performance orchestrated review.
              </p>
            </div>

            <div className="flex items-center gap-3">
               <button 
                  onClick={() => navigate('/kpi/my')}
                  className="px-6 py-3 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition border border-gray-200"
               >
                  Discard
               </button>
               <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[#0052CC] text-white text-xs font-bold rounded-lg hover:bg-[#0747A6] transition shadow-lg shadow-blue-200 flex items-center gap-2"
               >
                  {isSubmitting ? 'Submitting...' : 'Submit Progress'}
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Table Area */}
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white">
                     <TrendingUp className="w-3 h-3" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Active Performance Indicators</h3>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">KPI Identifier</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Current Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-32">Actual Value</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Evidence & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {kpis.map((kpi) => {
                        const progress = Math.min(Math.round((kpi.currentProgress / kpi.targetValue) * 100), 100);
                        return (
                          <tr key={kpi.id} className="group hover:bg-gray-50/30 transition-colors">
                            <td className="px-6 py-6">
                               <div className="flex gap-4">
                                  <div className={`w-1 h-12 rounded-full shrink-0 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}></div>
                                  <div>
                                     <p className="text-sm font-bold text-gray-900 mb-0.5">{kpi.title}</p>
                                     <p className="text-[10px] font-medium text-gray-400">Target: {kpi.targetValue} {kpi.unit || '%'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-6">
                               <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-4 w-full px-2">
                                     <span className="text-[10px] font-bold text-blue-600">{progress}%</span>
                                     <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-blue-600 rounded-full" 
                                          style={{ width: `${progress}%` }}
                                        ></div>
                                     </div>
                                     <span className="text-[9px] font-bold text-gray-300">{kpi.currentProgress}/{kpi.targetValue}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                     {progress >= 100 ? 'Completed' : progress >= 80 ? 'On Track' : 'Requires Focus'}
                                  </span>
                               </div>
                            </td>
                            <td className="px-6 py-6">
                               <input 
                                  type="number"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                                  value={formValues[kpi.id]?.actualValue || 0}
                                  onChange={(e) => handleValueChange(kpi.id, 'actualValue', Number(e.target.value))}
                               />
                            </td>
                            <td className="px-6 py-6">
                               <textarea 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs font-medium text-gray-600 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-none shadow-inner"
                                  rows={2}
                                  placeholder="Add evidence or justification..."
                                  value={formValues[kpi.id]?.evidenceNote || ''}
                                  onChange={(e) => handleValueChange(kpi.id, 'evidenceNote', e.target.value)}
                               />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
            </section>

            {/* Recent History Section */}
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Recent Update History</h3>
                  <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase">
                     View Full Log
                     <ChevronRight className="w-3 h-3" />
                  </button>
               </div>

               <div className="space-y-6">
                  {history.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border border-gray-50 rounded-xl hover:bg-gray-50/50 transition">
                       <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                          {log.evidenceNote ? <FileText className="w-5 h-5" /> : <History className="w-5 h-5" />}
                       </div>
                       <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                             <h4 className="text-sm font-bold text-gray-900">{log.goalTitle}</h4>
                             <span className="text-[10px] font-bold text-gray-300">{new Date(log.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">
                             {log.evidenceNote || `Updated actual value to ${log.actualValue}. No additional notes provided.`}
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                             <span className="bg-gray-100 text-[8px] font-bold text-gray-400 px-2 py-0.5 rounded uppercase tracking-widest">
                                {log.evidenceNote ? 'Annotated' : 'Quick Update'}
                             </span>
                             <span className="bg-blue-50 text-[8px] font-bold text-blue-400 px-2 py-0.5 rounded uppercase tracking-widest">
                                Verified
                             </span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <div className="text-center py-10">
                       <History className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                       <p className="text-sm text-gray-400 font-medium">No recent updates found.</p>
                    </div>
                  )}
               </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            {/* Status Card */}
            <section className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
               <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Submission Status</h3>
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                     <span className="text-xs font-bold text-gray-900">Update Required</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Last Submitted</p>
                        <p className="text-xs font-bold text-gray-900">12 days ago</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Review Deadline</p>
                        <p className="text-xs font-bold text-red-600">In 3 days</p>
                     </div>
                  </div>
               </div>
            </section>

            {/* Guidance Tooltip */}
            <section className="bg-[#E9F2FF] rounded-xl border border-blue-100 p-8">
               <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                     <Info className="w-4 h-4" />
                  </div>
                  <div className="space-y-3">
                     <h3 className="text-xs font-bold text-blue-900 uppercase tracking-widest">Guidance Tooltip</h3>
                     <p className="text-xs text-blue-800/70 leading-relaxed font-bold">
                        Evidence notes are mandatory for any changes exceeding ±15% of previous values. Please link to relevant Jira tickets or CRM dashboards.
                     </p>
                     <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase">
                        Read update policy
                        <ArrowRight className="w-3 h-3" />
                     </button>
                  </div>
               </div>
            </section>

            {/* Promotion Card */}
            <section className="bg-gray-900 rounded-xl p-10 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <h3 className="text-2xl font-bold tracking-tighter mb-2 italic">COLLBARRTION</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-10">Safe and Scalable</p>
                  <h4 className="text-xs font-bold uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                     Orchestrate your growth
                  </h4>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] rounded-full"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-600/10 blur-2xl rounded-full"></div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressUpdateWorkspace;
