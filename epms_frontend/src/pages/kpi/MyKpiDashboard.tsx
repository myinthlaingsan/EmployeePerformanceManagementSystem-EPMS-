import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useGetGoalSetByEmployeeQuery } from '../../services/kpiApi';
import ProgressUpdateModal from '../../components/kpi/ProgressUpdateModal';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { 
  ChevronRight, 
  History, 
  CheckCircle2, 
  Clock, 
  Target,
  ArrowRight,
  TrendingUp,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

const MyKpiDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeCycleId, activeCycleName } = useActiveCycle();

  const { data: goalSetResponse, isLoading } = useGetGoalSetByEmployeeQuery({
    employeeId: user?.id || 0,
    cycleId: activeCycleId
  }, { skip: !user });

  const [selectedKpi, setSelectedKpi] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const goalSet = goalSetResponse?.data;
  const kpis = goalSet?.items || [];

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 mb-8">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-4">
            <span>Performance</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900">My Goals</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  {activeCycleName} Goals
                </h1>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100">
                  {goalSet?.status || 'APPROVED'}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Review and track your performance objectives for this cycle.
              </p>
            </div>

            <div className="flex items-center gap-3">
               <button className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition border border-gray-200">
                  Request Revision
               </button>
               <button className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                  Acknowledge Goals
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main List - KPIs */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Active Objectives</h3>
            
            {kpis.map((kpi) => {
              const progress = Math.min(Math.round((kpi.currentProgress / kpi.targetValue) * 100), 100);
              return (
                <div key={kpi.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all p-6">
                   <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                              {kpi.title}
                           </h4>
                           <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                              W: {kpi.weightPercent}%
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-lg">
                           {kpi.description || 'No description provided for this objective.'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                           progress >= 100 ? 'bg-green-50 text-green-700 border-green-100' :
                           progress > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                           'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                           {progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
                        </span>
                        <button 
                          onClick={() => { setSelectedKpi(kpi); setIsUpdateModalOpen(true); }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                          Update Progress
                        </button>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-end text-xs mb-1">
                        <span className="font-bold text-gray-900">{progress}% <span className="text-gray-400 font-medium">Complete</span></span>
                        <span className="text-gray-400 font-bold uppercase text-[9px]">
                           {kpi.currentProgress} / {kpi.targetValue} {kpi.unit || '%'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-700 ease-out ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                           style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
              );
            })}

            {/* Support Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
               <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                     <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Alignment</h3>
                     <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        Directly aligned with <span className="text-blue-700 font-bold">Reliability & Scalability</span> initiative for 2024.
                     </p>
                  </div>
               </div>

               <div className="bg-white rounded-xl border border-gray-100 p-6 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                     <Calendar className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Review Date</h3>
                     <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                        Mid-cycle review: <span className="text-gray-900 font-bold">Nov 15, 2023</span>. Please update logs prior.
                     </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Side Content */}
          <div className="space-y-8">
            <section className="bg-white rounded-xl border border-gray-100 p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">History</h3>
                  <History className="w-4 h-4 text-gray-300" />
               </div>

               <div className="space-y-6 relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100"></div>

                  <div className="relative flex gap-4">
                     <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 z-10 border-2 border-white">
                        <CheckCircle2 className="w-3 h-3" />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-gray-900">Version 2 approved</p>
                        <p className="text-[10px] text-gray-400 font-medium">Oct 15, 2023</p>
                     </div>
                  </div>

                  <div className="relative flex gap-4">
                     <div className="w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 z-10 border-2 border-white">
                        <Clock className="w-3 h-3" />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-gray-900">Goal revised</p>
                        <p className="text-[10px] text-gray-400 font-medium">Oct 12, 2023</p>
                     </div>
                  </div>

                  <div className="relative flex gap-4">
                     <div className="w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 z-10 border-2 border-white">
                        <Target className="w-3 h-3" />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-gray-900">Draft Created</p>
                        <p className="text-[10px] text-gray-400 font-medium">Oct 01, 2023</p>
                     </div>
                  </div>
               </div>

               <button className="w-full mt-8 py-3 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:bg-gray-100 rounded-lg transition">
                  Audit Log
               </button>
            </section>

            <section className="bg-blue-600 rounded-xl p-8 text-white">
               <h3 className="text-sm font-bold uppercase tracking-wider mb-2">KPI Support</h3>
               <p className="text-xs text-blue-100 leading-relaxed font-medium mb-6">
                  Need help defining measurable targets or resources?
               </p>
               <button className="flex items-center gap-2 text-xs font-bold group hover:gap-4 transition-all">
                  <span>Open Library</span>
                  <ArrowRight className="w-4 h-4" />
               </button>
            </section>
          </div>
        </div>
      </div>

      {isUpdateModalOpen && selectedKpi && (
        <ProgressUpdateModal
          item={selectedKpi}
          onClose={() => setIsUpdateModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MyKpiDashboard;
