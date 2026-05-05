import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetGoalSetByEmployeeQuery,
  useGetAllLibrariesQuery,
  useAddGoalItemMutation,
  useUpdateGoalItemMutation,
  useDeleteGoalItemMutation,
  useApproveGoalSetMutation,
  useGetKpiCategoriesQuery
} from '../../services/kpiApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  Lock, 
  CheckCircle, 
  Info,
  RefreshCw,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { 
  getStatusColor, 
  getPriorityFromWeight,
  PRIORITY_MAP
} from '../../utils/kpiCalculations';

const GoalAssignmentWorkspace: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { activeCycleId, activeCycleName } = useActiveCycle();
  
  const { data } = useGetEmployeesQuery({ page: 0, size: 10 });

  const employees = data?.content ?? [];

  const employee = employees.find(
    e => e.id === Number(employeeId)
  );
  
  const { data: goalSetResponse, refetch: refetchGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: Number(employeeId),
    cycleId: activeCycleId
  }, { skip: !employeeId || !activeCycleId });

  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];
  
  const { data: categories = [] } = useGetKpiCategoriesQuery();

  const [addGoalItem] = useAddGoalItemMutation();
  const [updateGoalItem] = useUpdateGoalItemMutation();
  const [deleteGoalItem] = useDeleteGoalItemMutation();
  const [approveGoalSet] = useApproveGoalSetMutation();

  const goalSet = goalSetResponse?.data;
  const activeItems = goalSet?.items || [];
  
  const totalWeight = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + Number(item.weightPercent), 0);
  }, [activeItems]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLibraries = libraries.filter(lib => 
    lib.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddKpi = async (libDetail: any) => {
    if (!goalSet) return;
    try {
      await addGoalItem({
        goalSetId: goalSet.id,
        data: {
          title: libDetail.goalTitle,
          unit: libDetail.unit || 'Percent',
          targetValue: libDetail.targetValue,
          weightPercent: libDetail.weightPercent,
          categoryId: libDetail.categoryId
        }
      }).unwrap();
      refetchGoals();
    } catch (err) {
      console.error('Failed to add goal:', err);
    }
  };

  const handleUpdateItem = async (item: any, updates: any) => {
    try {
      await updateGoalItem({
        itemId: item.id,
        data: {
          title: updates.title ?? item.title,
          unit: updates.unit ?? item.unit,
          targetValue: updates.targetValue ?? item.targetValue,
          weightPercent: updates.weightPercent ?? item.weightPercent,
          categoryId: updates.categoryId ?? item.categoryId
        }
      }).unwrap();
      refetchGoals();
    } catch (err) {
      console.error('Failed to update goal:', err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await deleteGoalItem(itemId).unwrap();
      refetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleApprove = async () => {
    if (!goalSet) return;
    if (totalWeight !== 100) {
      alert("Total weight must be exactly 100% before approving.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await approveGoalSet(goalSet.id).unwrap();
      alert("Goals approved and locked!");
      navigate('/kpi/manage');
    } catch (err) {
      console.error('Failed to approve goals:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">

      <div className="p-8 max-w-400 mx-auto">
        {/* Profile Section */}
        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Assigning Goals for {employee?.staffName || 'Employee'}</h1>
                <span className="bg-gray-100 text-[10px] font-black text-gray-400 px-3 py-1 rounded-md uppercase tracking-widest">Draft</span>
              </div>
              <div className="flex items-center gap-8 mt-2">
                <div className="flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5 text-gray-300" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {employee?.employeeCode}</span>
                </div>
                <div className="flex items-center gap-2">
                   <RefreshCw className="w-3.5 h-3.5 text-gray-300" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle: {activeCycleName}</span>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  {employee?.positionName || 'Senior Product Designer'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="px-8 py-3 text-xs font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest transition">
                Save Draft
             </button>
             <button 
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-8 py-4 bg-blue-700 text-white text-[11px] font-black rounded-xl hover:bg-blue-800 transition shadow-xl shadow-blue-700/20 uppercase tracking-widest flex items-center gap-3"
             >
                <Lock className="w-4 h-4" />
                Approve & Lock
             </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* KPI Library Picker */}
          <aside className="w-full lg:w-96 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 shrink-0 sticky top-28">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">KPI Library</h3>
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
            
            <div className="space-y-6 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
              {libraries.map(lib => (
                <div key={lib.id} className="group border-b border-gray-50 pb-6 last:border-0 hover:bg-gray-50/50 p-2 rounded-xl transition">
                   <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                        lib.details?.[0]?.categoryId === 1 ? 'bg-blue-50 text-blue-500' :
                        lib.details?.[0]?.categoryId === 2 ? 'bg-orange-50 text-orange-500' :
                        'bg-purple-50 text-purple-500'
                      }`}>
                         {lib.details?.[0]?.categoryName || 'General'}
                      </span>
                      <button 
                        onClick={() => handleAddKpi(lib.details[0])}
                        className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>
                   <h4 className="text-sm font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition">{lib.title}</h4>
                   <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{lib.description}</p>
                </div>
              ))}
            </div>

            <button className="w-full mt-10 py-4 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50/50 transition">
              Request Custom KPI
            </button>
          </aside>

          {/* Main Goal Set Area */}
          <main className="flex-1 space-y-10">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                 <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Current KPI Goals (KPI_GOAL_ITEMS)</h3>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                    <span>Last synced: 2m ago</span>
                    <RefreshCw className="w-3 h-3" />
                 </div>
              </div>

              <table className="w-full">
                 <thead>
                    <tr className="border-b border-gray-100">
                       <th className="px-8 py-5 text-left text-[9px] font-black text-gray-300 uppercase tracking-widest">Title & Details</th>
                       <th className="px-8 py-5 text-center text-[9px] font-black text-gray-300 uppercase tracking-widest">Target Value</th>
                       <th className="px-8 py-5 text-left text-[9px] font-black text-gray-300 uppercase tracking-widest">Unit</th>
                       <th className="px-8 py-5 text-right text-[9px] font-black text-gray-300 uppercase tracking-widest">Weight %</th>
                       <th className="px-8 py-5 w-16"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {activeItems.map((item, index) => (
                      <tr key={item.id} className="group hover:bg-gray-50/30 transition-all">
                         <td className="px-8 py-8 max-w-sm">
                            <div className="flex gap-4">
                               <div className="w-1.5 h-12 bg-blue-700 rounded-full shrink-0"></div>
                               <div className="space-y-1">
                                  <input 
                                    className="bg-transparent border-none p-0 text-base font-black text-gray-900 w-full focus:ring-0"
                                    value={item.title}
                                    onChange={(e) => handleUpdateItem(item, { title: e.target.value })}
                                  />
                                  <p className="text-xs text-gray-400 leading-relaxed font-medium">Conduct and document quarterly strategic research.</p>
                                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">ID: {String(item.id).padStart(3, '0')}-ASSIGN</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-8 text-center">
                            <input 
                              type="number"
                              className="w-20 bg-gray-50/50 border border-gray-100 rounded-lg py-3 px-4 text-center font-black text-gray-900 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all shadow-inner"
                              value={item.targetValue}
                              onChange={(e) => handleUpdateItem(item, { targetValue: Number(e.target.value) })}
                            />
                         </td>
                         <td className="px-8 py-8">
                            <select 
                              className="bg-transparent border-none text-[11px] font-black text-gray-500 uppercase tracking-widest focus:ring-0 cursor-pointer"
                              value={item.unit || 'Percent'}
                              onChange={(e) => handleUpdateItem(item, { unit: e.target.value })}
                            >
                               <option value="Percent">% Percent</option>
                               <option value="Sessions">Sessions</option>
                               <option value="Days">Days</option>
                               <option value="Points">Points</option>
                            </select>
                         </td>
                         <td className="px-8 py-8 text-right">
                            <select 
                              className="bg-blue-50 border-none rounded-lg py-3 px-4 text-right font-black text-blue-700 focus:ring-2 focus:ring-blue-100 shadow-inner cursor-pointer"
                              value={Object.keys(PRIORITY_MAP).find(key => PRIORITY_MAP[key as keyof typeof PRIORITY_MAP].weight === item.weightPercent) || 'MEDIUM'}
                              onChange={(e) => {
                                const key = e.target.value as keyof typeof PRIORITY_MAP;
                                handleUpdateItem(item, { weightPercent: PRIORITY_MAP[key].weight });
                              }}
                            >
                               {Object.keys(PRIORITY_MAP).map(key => (
                                 <option key={key} value={key}>
                                   {PRIORITY_MAP[key as keyof typeof PRIORITY_MAP].label} ({PRIORITY_MAP[key as keyof typeof PRIORITY_MAP].weight}%)
                                 </option>
                               ))}
                            </select>
                         </td>
                         <td className="px-8 py-8 text-center">
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-gray-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>

              <div className="bg-gray-50/50 p-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-10">
                 <div className="flex gap-4 max-w-sm">
                    <div className="w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-1">i</div>
                    <p className="text-xs text-blue-800/60 font-bold leading-relaxed">
                      Total weight must equal 100% before the goal set can be approved and locked for the next cycle.
                    </p>
                 </div>
                 <div className="flex flex-col items-end gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aggregate Weight</span>
                    <div className="flex items-center gap-6">
                       <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full transition-all duration-700 ${totalWeight === 100 ? 'bg-blue-600' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(totalWeight, 100)}%` }}
                          ></div>
                       </div>
                       <span className={`text-4xl font-black ${totalWeight === 100 ? 'text-blue-700' : 'text-gray-900'}`}>{totalWeight}<span className="text-xl">%</span></span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Impact Distribution Footer */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col md:flex-row justify-between items-center gap-10">
               <div className="space-y-4 max-w-md">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Impact Distribution</h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-bold">Strategic alignment distribution for the selected KPIs.</p>
                  <div className="flex flex-wrap gap-2 mt-6">
                     <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-100">40% Efficiency</span>
                     <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">35% Quality</span>
                     <span className="px-3 py-1.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-purple-100">25% Innovation</span>
                  </div>
               </div>
               <div className="relative w-40 h-40">
                  <div className="absolute inset-0 border-16 border-blue-700 rounded-full shadow-inner shadow-blue-900/20"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-4xl font-black text-gray-900 tracking-tighter">3/3</span>
                  </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default GoalAssignmentWorkspace;
