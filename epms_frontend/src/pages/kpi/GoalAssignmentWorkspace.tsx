import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useGetGoalSetByEmployeeQuery,
  useGetAllLibrariesQuery,
  useAddGoalItemMutation,
  useDeleteGoalItemMutation,
  useBulkUpdateGoalItemsMutation,
  useApproveGoalSetMutation,
  useRevertGoalSetMutation,
  useGetKpiCategoriesQuery,
  useAssignKpiToEmployeeMutation,
} from '../../services/kpiApi';
import { useGetEmployeeByIdQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import {
  Search, Plus, Trash2, Lock, LayoutTemplate, Target, Save, Edit3, History, ChevronLeft
} from 'lucide-react';
import React from 'react';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  DRAFT: { bg: '#EEF3FD', text: '#0C447C', border: '#B5D4F4' },
  LOCKED: { bg: '#111827', text: '#FFFFFF', border: '#111827' },
};

const GoalAssignmentWorkspace: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isHR, activeCycleId, activeCycleName, isLoadingCycle: isLoadingActiveCycle } = useAuth();

  const { data: employee } = useGetEmployeeByIdQuery(Number(employeeId), { skip: !employeeId });
  const { data: goalSetResponse, refetch: refetchGoals } = useGetGoalSetByEmployeeQuery({
    employeeId: Number(employeeId),
    cycleId: activeCycleId!
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (goalSet?.items) {
      setLocalItems(goalSet.items);
      setIsModified(false);
    }
  }, [goalSet]);

  const totalWeight = useMemo(() => localItems.reduce((sum, item) => sum + Number(item.weightPercent), 0), [localItems]);
  const overweightItems = useMemo(() => localItems.filter(item => Number(item.weightPercent) > 35), [localItems]);

  const filteredLibraries = libraries.filter(lib =>
    (lib.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = async (library: any) => {
    if (!activeCycleId) return;
    setIsSubmitting(true);
    try {
      if (!goalSet || overwriteExisting) {
        await assignLibrary({ employeeId: Number(employeeId), libraryId: library.id, appraisalCycleId: activeCycleId, overwriteExisting }).unwrap();
      } else {
        for (const detail of library.details) {
          await addGoalItem({ goalSetId: goalSet.id, data: { title: detail.goalTitle, unit: detail.unit || 'Percent', targetValue: detail.targetValue, weightPercent: detail.weightPercent, categoryId: detail.categoryId } }).unwrap();
        }
      }
      refetchGoals();
      toast.success(overwriteExisting ? 'Goals replaced successfully!' : 'Template items appended successfully!');
    } catch (err: any) {
      toast.error(`Failed to apply template: ${err?.data?.message || err?.message || 'Check network/permissions'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomGoal = async () => {
    if (!activeCycleId) return;
    try {
      let currentGoalSetId = goalSet?.id;
      if (!currentGoalSetId) {
        const newGoalSet = await assignLibrary({ employeeId: Number(employeeId), appraisalCycleId: activeCycleId }).unwrap();
        currentGoalSetId = newGoalSet.data.id;
      }
      await addGoalItem({ goalSetId: currentGoalSetId!, data: { title: 'New Custom KPI', unit: 'Percent', targetValue: 0, weightPercent: 0, categoryId: (categories as any)?.[0]?.id || 1 } }).unwrap();
      refetchGoals();
    } catch (err: any) {
      toast.error(`Failed to add custom goal: ${err?.data?.message || err.message}`);
    }
  };

  const handleLocalUpdate = (itemId: number, updates: any) => {
    setLocalItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    setIsModified(true);
  };

  const handleSaveDraft = async () => {
    if (!goalSet) return;
    setIsSubmitting(true);
    try {
      const cleanedItems = localItems.map(item => ({
        id: item.id,
        title: item.title,
        unit: item.unit,
        targetValue: item.targetValue === '' ? 0 : Number(item.targetValue),
        weightPercent: item.weightPercent === '' ? 0 : Number(item.weightPercent),
        categoryId: item.categoryId
      }));
      await bulkUpdateItems({ goalSetId: goalSet.id, data: { items: cleanedItems } }).unwrap();
      setIsModified(false);
      toast.success('Draft saved successfully!');
    } catch (err: any) {
      toast.error(`Failed to save draft: ${err?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!goalSet) return;
    if (!window.confirm('This will revert the status to DRAFT so you can make changes. Continue?')) return;
    setIsSubmitting(true);
    try { await revertToDraft(goalSet.id).unwrap(); }
    catch (err: any) { toast.error(`Failed to revert: ${err?.data?.message || err.message}`); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this goal? This change is immediate.')) return;
    try { await deleteGoalItem(itemId).unwrap(); }
    catch (err: any) { toast.error(err?.data?.message || 'Failed to delete goal bc of progress exists'); }
  };

  const handleApprove = async () => {
    if (!goalSet) return;
    if (totalWeight !== 100) { toast.warning('Total weight must be exactly 100% before approving.'); return; }
    if (isModified) { toast.warning('Please save your draft changes before approving.'); return; }
    setIsSubmitting(true);
    try {
      await approveGoalSet(goalSet.id).unwrap();
      toast.success('Goals approved and locked!');
      navigate(isAdmin || isHR ? '/kpi/manage' : '/kpi/team');
    } catch { /* handled by RTK */ }
    finally { setIsSubmitting(false); }
  };

  if (isLoadingActiveCycle) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Resolving active cycle…</div>
  );

  if (!activeCycleId) return (
    <div className="space-y-4 pb-8">
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '48px 24px', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FCEBEB', color: '#791F1F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Target size={24} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 8 }}>No Active Cycle</h2>
        <p style={{ fontSize: 13, color: '#9EA3B0', marginBottom: 20, lineHeight: 1.6 }}>An active appraisal cycle is required to assign or view KPIs. Please contact your system administrator to open a new cycle.</p>
        <button onClick={() => navigate(-1)} style={{ background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 500 }}>Go Back</button>
      </div>
    </div>
  );

  const ss = goalSet?.status ? (STATUS_STYLE[goalSet.status] || { bg: '#F5F6F8', text: '#9EA3B0', border: '#E0E2E8' }) : null;

  return (
    <div className="space-y-4 pb-8">
      <button onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5A6070', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        className="hover:text-[#111827] transition-colors">
        <ChevronLeft size={14} /> Back
      </button>

      {/* Header */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 20px' }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EEF3FD', color: '#1A56DB', fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {employee?.staffName?.[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 style={{ fontSize: 16, fontWeight: 500, color: '#111827' }}>{employee?.staffName}</h1>
              {ss && (
                <span style={{ fontSize: 10, fontWeight: 500, background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`, borderRadius: 20, padding: '2px 8px' }}>
                  {goalSet?.status}
                </span>
              )}
              {!goalSet && (
                <span style={{ fontSize: 10, fontWeight: 500, background: '#F5F6F8', color: '#9EA3B0', border: '0.5px solid #E0E2E8', borderRadius: 20, padding: '2px 8px' }}>Not Assigned</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#9EA3B0', marginTop: 2 }}>{employee?.employeeCode} &bull; {employee?.positionName} &bull; Cycle: {activeCycleName}</p>
          </div>
          <button onClick={() => navigate(`/kpi/history/${employeeId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500 }}
            className="hover:bg-[#E0E2E8] transition-colors">
            <History size={13} /> View History
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {goalSet?.status === 'APPROVED' ? (
            <button onClick={handleEdit} disabled={isSubmitting}
              style={{ background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
              className="disabled:opacity-50">
              <Edit3 size={13} /> Edit Goals
            </button>
          ) : (
            <>
              <button onClick={handleSaveDraft} disabled={isSubmitting || !isModified}
                style={{ background: isModified ? '#1A56DB' : '#F5F6F8', color: isModified ? '#FFFFFF' : '#9EA3B0', border: isModified ? 'none' : '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                className="disabled:opacity-50">
                <Save size={13} /> {isModified ? 'Save Draft' : 'Draft Saved'}
              </button>
              <button onClick={handleApprove} disabled={isSubmitting || totalWeight !== 100 || isModified}
                style={{ background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
                className="disabled:opacity-50 disabled:cursor-not-allowed">
                <Lock size={13} /> Approve Goal Set
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Sidebar */}
        <aside style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px' }} className="w-full lg:w-72 shrink-0">
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KPI Templates</p>
            <LayoutTemplate size={13} style={{ color: '#9EA3B0' }} />
          </div>

          {goalSet && (
            <div style={{ background: '#FAEEDA', border: '0.5px solid #F0D4A4', borderRadius: 8, padding: '8px 10px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="overwriteToggle" style={{ accentColor: '#633806', width: 13, height: 13 }}
                checked={overwriteExisting} onChange={e => setOverwriteExisting(e.target.checked)} />
              <label htmlFor="overwriteToggle" style={{ fontSize: 10, fontWeight: 500, color: '#633806', textTransform: 'uppercase', letterSpacing: '0.5px', cursor: 'pointer' }}>Replace Existing Goals</label>
            </div>
          )}

          <div className="relative" style={{ marginBottom: 12 }}>
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
            <input type="text" placeholder="Search templates…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 10px 7px 28px', fontSize: 12, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }} className="space-y-2">
            {filteredLibraries.map(lib => (
              <div key={lib.id} onClick={() => handleUseTemplate(lib)}
                style={{ border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '10px 12px', cursor: 'pointer' }}
                className="hover:border-[#1A56DB] hover:bg-[#EEF3FD] transition-colors">
                <div className="flex justify-between items-start" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 9, fontWeight: 500, background: '#F5F6F8', color: '#9EA3B0', border: '0.5px solid #E0E2E8', borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' }}>{lib.positionName || 'General'}</span>
                  <Plus size={12} style={{ color: '#1A56DB' }} />
                </div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{lib.title}</p>
              </div>
            ))}
          </div>

          {!goalSet && (
            <button onClick={async () => {
              if (!activeCycleId) return;
              try { await assignLibrary({ employeeId: Number(employeeId), appraisalCycleId: activeCycleId }).unwrap(); refetchGoals(); }
              catch (err: any) { toast.error(`Failed to start blank session: ${err?.data?.message || err.message}`); }
            }}
              style={{ width: '100%', marginTop: 16, padding: '9px', border: '0.5px dashed #E0E2E8', borderRadius: 8, fontSize: 11, fontWeight: 500, color: '#9EA3B0', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              className="hover:bg-[#F5F6F8] transition-colors">
              <Target size={12} /> Start Blank Session
            </button>
          )}

          <button onClick={handleAddCustomGoal}
            style={{ width: '100%', marginTop: goalSet ? 16 : 8, padding: '9px', border: '0.5px dashed #B5D4F4', borderRadius: 8, fontSize: 11, fontWeight: 500, color: '#0C447C', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            className="hover:bg-[#EEF3FD] transition-colors">
            <Plus size={12} /> Add Custom Goal
          </button>
        </aside>

        {/* Goal Table */}
        <main className="flex-1 min-w-0">
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '10px 16px', background: '#FAFBFF', borderBottom: '0.5px solid #E4E6EC' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Goal Assignments</p>
              <span style={{ fontSize: 11, color: '#9EA3B0' }}>{localItems.length} KPI items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 600, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAFBFF', borderBottom: '0.5px solid #E4E6EC' }}>
                    {['Goal Title', 'Category', 'Target', 'Unit', 'Weight', ''].map((h, i) => (
                      <th key={i} style={{ padding: '9px 14px', fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i >= 2 && i <= 4 ? 'center' : i === 5 ? 'center' : 'left', borderBottom: '0.5px solid #E4E6EC', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx < localItems.length - 1 ? '0.5px solid #F0F2F6' : 'none' }} className="hover:bg-[#FAFBFF] transition-colors">
                      <td style={{ padding: '10px 14px' }}>
                        <input type="text"
                          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 13, fontWeight: 500, color: '#111827', outline: 'none', width: '100%' }}
                          value={item.title}
                          onChange={e => handleLocalUpdate(item.id, { title: e.target.value })}
                          disabled={goalSet?.status === 'APPROVED'} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <select
                          style={{ fontSize: 11, background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '3px 6px', color: '#5A6070', outline: 'none' }}
                          value={item.categoryId}
                          onChange={e => handleLocalUpdate(item.id, { categoryId: Number(e.target.value) })}
                          disabled={goalSet?.status === 'APPROVED'}>
                          {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input type="number" min="0"
                          style={{ width: 64, background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '4px 6px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: '#111827', outline: 'none' }}
                          value={item.targetValue === undefined || item.targetValue === null || item.targetValue === '' ? '' : item.targetValue}
                          onKeyDown={e => {
                            if (e.key === '-') {
                              e.preventDefault();
                            }
                          }}
                          onChange={e => {
                            const val = e.target.value;
                            handleLocalUpdate(item.id, { targetValue: val === '' ? '' : Math.max(0, Number(val)) });
                          }}
                          disabled={goalSet?.status === 'APPROVED'} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input type="text"
                          style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12, color: '#5A6070', textAlign: 'center', outline: 'none', width: '100%' }}
                          value={item.unit}
                          onChange={e => handleLocalUpdate(item.id, { unit: e.target.value })}
                          disabled={goalSet?.status === 'APPROVED'} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-1">
                          <input type="number" min="0" max="35"
                            style={{ width: 56, background: Number(item.weightPercent) > 35 ? '#FCEBEB' : '#EEF3FD', border: `0.5px solid ${Number(item.weightPercent) > 35 ? '#F5BFBF' : '#B5D4F4'}`, borderRadius: 6, padding: '4px 6px', textAlign: 'right', fontSize: 12, fontWeight: 500, color: Number(item.weightPercent) > 35 ? '#791F1F' : '#0C447C', outline: 'none' }}
                            value={item.weightPercent === undefined || item.weightPercent === null || item.weightPercent === '' ? '' : item.weightPercent}
                            onKeyDown={e => {
                              if (e.key === '-') {
                                e.preventDefault();
                              }
                            }}
                            onChange={e => {
                              const val = e.target.value;
                              handleLocalUpdate(item.id, { weightPercent: val === '' ? '' : Math.max(0, Number(val)) });
                            }}
                            disabled={goalSet?.status === 'APPROVED'} />
                          <span style={{ fontSize: 11, color: Number(item.weightPercent) > 35 ? '#791F1F' : '#0C447C' }}>%</span>
                        </div>
                        {Number(item.weightPercent) > 35 && (
                          <p style={{ fontSize: 9, color: '#791F1F', marginTop: 2, textAlign: 'center' }}>Max 35%</p>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button onClick={() => handleDeleteItem(item.id)} disabled={goalSet?.status === 'APPROVED'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E0E2E8', padding: 4 }}
                          className="hover:text-[#791F1F] transition-colors disabled:opacity-0">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={6} style={{ padding: 0, borderTop: '0.5px solid #F0F2F6' }}>
                      <button onClick={handleAddCustomGoal}
                        style={{ width: '100%', padding: '10px', fontSize: 12, fontWeight: 500, color: '#1A56DB', background: '#FAFBFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                        className="hover:bg-[#EEF3FD] transition-colors">
                        <Plus size={13} /> Add New Goal Row
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 20px', background: totalWeight > 100 || overweightItems.length > 0 ? '#1F0A0A' : '#111827', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Aggregate Weight</p>
                <div className="flex items-center gap-3">
                  <div style={{ width: 160, height: 6, background: '#374151', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.5s', width: `${Math.min(totalWeight, 100)}%`, background: totalWeight === 100 ? '#27500A' : totalWeight > 100 ? '#791F1F' : '#1A56DB' }} />
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 500, color: totalWeight > 100 ? '#F87171' : '#FFFFFF' }}>{totalWeight}%</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: totalWeight === 100 && overweightItems.length === 0 ? '#B8DCA0' : totalWeight > 100 || overweightItems.length > 0 ? '#F87171' : '#B5D4F4' }}>
                  {totalWeight === 100 && overweightItems.length === 0 ? 'Verified' : totalWeight > 100 ? `Exceeded by ${totalWeight - 100}%` : `${100 - totalWeight}% Remaining`}
                </p>
                {overweightItems.length > 0 && (
                  <p style={{ fontSize: 10, color: '#F87171', marginTop: 4 }}>
                    {overweightItems.length} item{overweightItems.length > 1 ? 's' : ''} exceed{overweightItems.length === 1 ? 's' : ''} 35% cap
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GoalAssignmentWorkspace;
