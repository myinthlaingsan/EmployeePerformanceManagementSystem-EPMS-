import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetGoalSetByEmployeeQuery,
  useGetAllLibrariesQuery,
  useAddGoalItemMutation,
  useDeleteGoalItemMutation,
  useBulkUpdateGoalItemsMutation,
  useApproveGoalSetMutation,
  useRevertGoalSetMutation,
  useGetKpiCategoriesQuery,
  useAssignKpiToEmployeeMutation
} from '../../services/kpiApi';
import { useGetEmployeeByIdQuery } from '../../features/employee/employeeapi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import {
  Search,
  Plus,
  Trash2,
  Lock,
  LayoutTemplate,
  Target,
  Save,
  Edit3,
  Undo2
} from 'lucide-react';
import {
  PRIORITY_MAP
} from '../../utils/kpiCalculations';

const GoalAssignmentWorkspace: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { activeCycleId, activeCycleName } = useActiveCycle();

  const { data: employee } = useGetEmployeeByIdQuery(Number(employeeId), { skip: !employeeId });
  const { data: goalSetResponse, refetch: refetchGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: Number(employeeId),
    cycleId: activeCycleId
  }, { skip: !employeeId || !activeCycleId });

  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const { data: categoriesResponse } = useGetKpiCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [addGoalItem] = useAddGoalItemMutation();
  const [deleteGoalItem] = useDeleteGoalItemMutation();
  const [bulkUpdateItems] = useBulkUpdateGoalItemsMutation();
  const [approveGoalSet] = useApproveGoalSetMutation();
  const [revertToDraft] = useRevertGoalSetMutation();
  const [assignLibrary] = useAssignKpiToEmployeeMutation();

  const goalSet = goalSetResponse?.data;
  const [localItems, setLocalItems] = React.useState<any[]>([]);
  const [isModified, setIsModified] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // Sync local items with server data when it loads
  React.useEffect(() => {
    if (goalSet?.items) {
      setLocalItems(goalSet.items);
      setIsModified(false);
    }
  }, [goalSet]);

  const activeItems = localItems;

  const totalWeight = useMemo(() => {
    return activeItems.reduce((sum, item) => sum + Number(item.weightPercent), 0);
  }, [activeItems]);

  const overweightItems = useMemo(() => {
    return activeItems.filter(item => Number(item.weightPercent) > 35);
  }, [activeItems]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLibraries = libraries.filter(lib =>
    (lib.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = async (library: any) => {
    if (!activeCycleId) return;
    setIsSubmitting(true);
    try {
      if (!goalSet || overwriteExisting) {
        await assignLibrary({
          employeeId: Number(employeeId),
          libraryId: library.id,
          appraisalCycleId: activeCycleId,
          overwriteExisting: overwriteExisting
        }).unwrap();
      } else {
        // Default behavior: Append to existing
        for (const detail of library.details) {
          await addGoalItem({
            goalSetId: goalSet.id,
            data: {
              title: detail.goalTitle,
              unit: detail.unit || 'Percent',
              targetValue: detail.targetValue,
              weightPercent: detail.weightPercent,
              categoryId: detail.categoryId
            }
          }).unwrap();
        }
      }
      refetchGoals();
      alert(overwriteExisting ? "Goals replaced successfully!" : "Template items appended successfully!");
    } catch (err: any) {
      console.error('Failed to apply template:', err);
      const errorMsg = err?.data?.message || err?.message || "Check network/permissions";
      alert(`Failed to apply template: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomGoal = async () => {
    if (!activeCycleId) return;

    try {
      let currentGoalSetId = goalSet?.id;

      if (!currentGoalSetId) {
        // Initialize blank session
        const newGoalSet = await assignLibrary({
          employeeId: Number(employeeId),
          appraisalCycleId: activeCycleId
        }).unwrap();
        currentGoalSetId = newGoalSet.data.id;
        // We don't refetch here yet, we'll do it after adding the item or let the mutation tags handle it
      }

      await addGoalItem({
        goalSetId: currentGoalSetId!,
        data: {
          title: 'New Custom KPI',
          unit: 'Percent',
          targetValue: 0,
          weightPercent: 0,
          categoryId: (categories as any)?.[0]?.id || 1
        }
      }).unwrap();
      refetchGoals();
    } catch (err: any) {
      console.error('Failed to add custom goal:', err);
      alert(`Failed to add custom goal: ${err?.data?.message || err.message}`);
    }
  };

  const handleLocalUpdate = (itemId: number, updates: any) => {
    setLocalItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
    setIsModified(true);
  };

  const handleSaveDraft = async () => {
    if (!goalSet) return;
    setIsSubmitting(true);
    try {
      await bulkUpdateItems({
        goalSetId: goalSet.id,
        data: {
          items: localItems.map(item => ({
            id: item.id,
            title: item.title,
            unit: item.unit,
            targetValue: item.targetValue,
            weightPercent: item.weightPercent,
            categoryId: item.categoryId
          }))
        }
      }).unwrap();
      setIsModified(false);
      alert("Draft saved successfully!");
    } catch (err: any) {
      console.error('Failed to save draft:', err);
      alert(`Failed to save draft: ${err?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!goalSet) return;
    if (!window.confirm("This will revert the status to DRAFT so you can make changes. Continue?")) return;

    setIsSubmitting(true);
    try {
      await revertToDraft(goalSet.id).unwrap();
    } catch (err: any) {
      console.error('Failed to revert to draft:', err);
      alert(`Failed to revert: ${err?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to delete this goal? This change is immediate.")) return;
    try {
      await deleteGoalItem(itemId).unwrap();
      // Tag invalidation will refetch, which will trigger useEffect to sync localItems
    } catch (err: any) {
      const message = err?.data?.message || 'Failed to delete goal bc of progress exists';
      alert(message);
    }
  };

  const handleApprove = async () => {
    if (!goalSet) return;
    if (totalWeight !== 100) {
      alert("Total weight must be exactly 100% before approving.");
      return;
    }

    if (isModified) {
      alert("Please save your draft changes before approving.");
      return;
    }

    setIsSubmitting(true);
    try {
      await approveGoalSet(goalSet.id).unwrap();
      alert("Goals approved and locked!");
      navigate('/kpi/team');
    } catch (err) {
      console.error('Failed to approve goals:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-8 max-w-[1600px] mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-wider transition-colors"
        >
          ← Back
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl px-8 py-6 border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-2xl">
              {employee?.staffName?.[0]}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">{employee?.staffName}</h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${goalSet?.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                  goalSet?.status === 'DRAFT' ? 'bg-blue-50 text-blue-600' :
                    goalSet?.status === 'SUBMITTED' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-100 text-gray-400'
                  }`}>
                  {goalSet ? goalSet.status : 'Not Assigned'}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>{employee?.employeeCode}</span>
                <span>{employee?.positionName}</span>
                <span>Cycle: {activeCycleName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {goalSet?.status === 'APPROVED' ? (
              <button
                onClick={handleEdit}
                disabled={isSubmitting}
                className="px-8 py-4 bg-blue-600 text-white text-[11px] font-black rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition shadow-xl uppercase tracking-widest flex items-center gap-3"
              >
                <Edit3 className="w-4 h-4" />
                Edit Goals
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || !isModified}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white text-[11px] font-black rounded-xl transition shadow-xl uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isModified ? 'Save Draft' : 'Draft Saved'}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isSubmitting || totalWeight !== 100 || isModified}
                  className="px-8 py-4 bg-gray-900 text-white text-[11px] font-black rounded-xl hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition shadow-xl uppercase tracking-widest flex items-center gap-3"
                >
                  <Lock className="w-4 h-4" />
                  Approve & Lock
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-80 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 shrink-0 sticky top-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">KPI Templates</h3>
              <LayoutTemplate className="w-4 h-4 text-gray-400" />
            </div>

            {goalSet && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwriteToggle"
                  className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500/20 cursor-pointer"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                />
                <label htmlFor="overwriteToggle" className="text-[9px] font-black text-amber-900 uppercase tracking-widest cursor-pointer">
                  Replace Existing Goals
                </label>
              </div>
            )}

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredLibraries.map(lib => (
                <div
                  key={lib.id}
                  className="group border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer"
                  onClick={() => handleUseTemplate(lib)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black text-gray-500 rounded uppercase tracking-widest">
                      {lib.positionName || 'General'}
                    </span>
                    <Plus className="w-4 h-4 text-blue-600 group-hover:rotate-90 transition-transform" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{lib.title}</h4>
                </div>
              ))}
            </div>

            {!goalSet && (
              <button
                onClick={async () => {
                  if (!activeCycleId) return;
                  try {
                    await assignLibrary({
                      employeeId: Number(employeeId),
                      appraisalCycleId: activeCycleId
                    }).unwrap();
                    refetchGoals();
                  } catch (err: any) {
                    alert(`Failed to start blank session: ${err?.data?.message || err.message}`);
                  }
                }}
                className="w-full mt-8 py-4 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                Start Blank Session
              </button>
            )}

            <button
              onClick={handleAddCustomGoal}
              className={`w-full ${goalSet ? 'mt-8' : 'mt-3'} py-4 border-2 border-dashed border-blue-100 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center justify-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Add Custom Goal
            </button>
          </aside>

          {/* Goal Table (Spreadsheet Style) */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Goal Assignments</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{activeItems.length} KPI items</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 border border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest">Goal Title</th>
                      <th className="px-4 py-3 border border-gray-200 text-[9px] font-black text-gray-400 uppercase tracking-widest w-28 text-center">Category</th>
                      <th className="px-4 py-3 border border-gray-200 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest w-20">Target</th>
                      <th className="px-4 py-3 border border-gray-200 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest w-24">Unit</th>
                      <th className="px-4 py-3 border border-gray-200 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest w-40">Weight</th>
                      <th className="w-10 border border-gray-200"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeItems.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/20 transition-all">
                        <td className="px-4 py-3 border border-gray-100">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 disabled:text-gray-400"
                            value={item.title}
                            onChange={(e) => handleLocalUpdate(item.id, { title: e.target.value })}
                            disabled={goalSet?.status === 'APPROVED'}
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-100 text-center">
                          <select
                            className="text-[9px] font-black uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border-none focus:ring-0 cursor-pointer text-gray-500 disabled:opacity-50"
                            value={item.categoryId}
                            onChange={(e) => handleLocalUpdate(item.id, { categoryId: Number(e.target.value) })}
                            disabled={goalSet?.status === 'APPROVED'}
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 border border-gray-100 text-center">
                          <input
                            type="number"
                            className="w-16 bg-gray-50/50 border border-gray-100 rounded-lg py-1 px-1 text-center text-xs font-black text-gray-900 disabled:opacity-50"
                            value={item.targetValue}
                            onChange={(e) => handleLocalUpdate(item.id, { targetValue: Number(e.target.value) })}
                            disabled={goalSet?.status === 'APPROVED'}
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-100 text-center">
                          <input
                            type="text"
                            className="w-full bg-transparent border-none p-0 text-xs font-bold text-gray-400 text-center focus:ring-0 disabled:opacity-50"
                            value={item.unit}
                            onChange={(e) => handleLocalUpdate(item.id, { unit: e.target.value })}
                            disabled={goalSet?.status === 'APPROVED'}
                          />
                        </td>
                        <td className="px-4 py-3 border border-gray-100 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              className={`w-16 rounded-lg py-1.5 px-2 text-right text-xs font-black focus:bg-white disabled:opacity-50 ${Number(item.weightPercent) > 35
                                ? 'bg-red-50 border border-red-300 text-red-700'
                                : 'bg-blue-50/50 border border-blue-100 text-blue-700'
                                }`}
                              value={item.weightPercent}
                              onChange={(e) => handleLocalUpdate(item.id, { weightPercent: Number(e.target.value) })}
                              disabled={goalSet?.status === 'APPROVED'}
                            />
                            <span className={`text-[10px] font-bold ${Number(item.weightPercent) > 35 ? 'text-red-400' : 'text-blue-300'}`}>%</span>
                          </div>
                          {Number(item.weightPercent) > 35 && (
                            <p className="text-[9px] font-bold text-red-500 mt-1 text-right">Max 35%</p>
                          )}
                        </td>
                        <td className="px-2 py-3 border border-gray-100 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            disabled={goalSet?.status === 'APPROVED'}
                            className="text-gray-200 hover:text-red-500 transition-colors disabled:opacity-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Spreadsheet Add Row Button */}
                    <tr>
                      <td colSpan={6} className="p-0 border border-gray-200 bg-gray-50/30">
                        <button
                          onClick={handleAddCustomGoal}
                          className="w-full py-4 flex items-center justify-center gap-3 text-blue-600 bg-blue-50/50 hover:bg-blue-100/50 transition-all group"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Plus className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest">Add New Goal Row</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Progress Summary Footer */}
              <div className={`px-8 py-5 flex justify-between items-center ${totalWeight > 100 || overweightItems.length > 0 ? 'bg-red-950' : 'bg-gray-900'}`}>
                <div className="flex items-center gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aggregate Weight</p>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${totalWeight === 100 ? 'bg-green-500' : totalWeight > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(totalWeight, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-3xl font-black ${totalWeight > 100 ? 'text-red-400' : 'text-white'}`}>{totalWeight}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className={`text-xs font-black uppercase tracking-widest ${totalWeight === 100 && overweightItems.length === 0 ? 'text-green-400' :
                    totalWeight > 100 || overweightItems.length > 0 ? 'text-red-400' : 'text-blue-400'
                    }`}>
                    {totalWeight === 100 && overweightItems.length === 0
                      ? 'Verified'
                      : totalWeight > 100
                        ? `Exceeded by ${totalWeight - 100}%`
                        : `${100 - totalWeight}% Remaining`}
                  </p>
                  {overweightItems.length > 0 && (
                    <p className="text-[10px] font-bold text-red-400">
                      ⚠ {overweightItems.length} item{overweightItems.length > 1 ? 's' : ''} exceed{overweightItems.length === 1 ? 's' : ''} 35% cap
                    </p>
                  )}
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
