import React, { useState } from 'react';
import { 
  useGetFeedbackConfigsQuery, 
  useLazyPreviewFeedbackRequestsQuery,
  useGenerateFeedbackRequestsMutation,
  useGetSummariesByCycleQuery,
  useGenerateAllSummariesMutation,
  useFinalizeSummaryMutation,
  useUpdateFeedbackConfigMutation
} from '../../features/feedback360/feedback360Api';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { 
  Settings, 
  Zap, 
  BarChart3, 
  Users, 
  RefreshCcw, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  X,
  Eye,
  FileText,
  Shield
} from 'lucide-react';

const Feedback360Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'summaries' | 'config'>('requests');
  const { data: cycles } = useGetCyclesQuery();
  const { activeCycleId } = useActiveCycle();
  const [selectedCycle, setSelectedCycle] = useState<string>(activeCycleId?.toString() || '');
  
  React.useEffect(() => {
    if (activeCycleId && !selectedCycle) {
      setSelectedCycle(activeCycleId.toString());
    }
  }, [activeCycleId]);
  
  // Requests Management
  const [previewRequests, { data: previewData, isLoading: loadingPreview }] = useLazyPreviewFeedbackRequestsQuery();
  const [generateRequests, { isLoading: generating }] = useGenerateFeedbackRequestsMutation();
  const [excludeLongTermLeave, setExcludeLongTermLeave] = useState(true);
  const [globalMaxLimit, setGlobalMaxLimit] = useState(7);

  // Summaries Management
  const { data: summaries, isLoading: loadingSummaries } = useGetSummariesByCycleQuery(parseInt(selectedCycle, 10), {
    skip: !selectedCycle || activeTab !== 'summaries'
  });
  const [generateAllSummaries] = useGenerateAllSummariesMutation();
  const [finalizeSummary] = useFinalizeSummaryMutation();

  // Config Management
  const { data: configs } = useGetFeedbackConfigsQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: allJobLevels } = useGetJobLevelsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: '',
    levelId: '',
    minPeers: 2,
    maxPeers: 4,
    minSubordinates: 0,
    maxSubordinates: 5,
    allowCrossDepartment: false
  });
  const [updateConfig] = useUpdateFeedbackConfigMutation();

  const handlePreview = () => {
    if (!selectedCycle) return;
    previewRequests({
      cycleId: parseInt(selectedCycle, 10),
      globalMaxLimit,
      excludeLongTermLeave
    });
  };

  const handleGenerate = async () => {
    if (!selectedCycle) return;
    if (!window.confirm('Are you sure you want to generate feedback requests for all employees? This cannot be undone.')) return;
    try {
      await generateRequests({
        cycleId: parseInt(selectedCycle, 10),
        globalMaxLimit,
        excludeLongTermLeave
      }).unwrap();
      alert('Requests generated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId, 10) : null,
        levelId: formData.levelId ? parseInt(formData.levelId, 10) : null
      };
      await updateConfig(payload).unwrap();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-text-title tracking-tight">360° Feedback Administration</h1>
          <p className="text-text-subtitle mt-1">Manage cycles, generation rules, and reports</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm">
          {(['requests', 'summaries', 'config'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105' 
                  : 'text-text-subtitle hover:text-brand-primary hover:bg-brand-primary/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Global Controls */}
      <div className="bg-white p-8 rounded-[32px] border border-surface-border shadow-sm flex flex-wrap items-center gap-8">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-black text-text-subtitle uppercase tracking-widest mb-2">Select Active Cycle</label>
          <select 
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 font-bold text-text-title outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <option value="">{cycles ? 'Choose a cycle...' : 'Loading cycles...'}</option>
            {Array.isArray(cycles) ? cycles.map((c: any) => (
              <option key={c.cycleId || c.id} value={c.cycleId || c.id}>
                {c.cycleName || c.name || `Cycle ${c.cycleId || c.id}`}
              </option>
            )) : (cycles as any)?.data?.map((c: any) => (
              <option key={c.cycleId || c.id} value={c.cycleId || c.id}>
                {c.cycleName || c.name || `Cycle ${c.cycleId || c.id}`}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'requests' && (
          <>
            <div className="flex items-center gap-6 p-4 bg-surface-base rounded-2xl border border-surface-border">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={excludeLongTermLeave}
                  onChange={(e) => setExcludeLongTermLeave(e.target.checked)}
                  className="w-5 h-5 rounded border-surface-border text-brand-primary focus:ring-brand-primary"
                />
                <span className="text-sm font-bold text-text-title">Exclude Leave</span>
              </div>
              <div className="h-6 w-px bg-surface-border" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-text-title">Max Limit:</span>
                <input 
                  type="number" 
                  value={globalMaxLimit}
                  onChange={(e) => setGlobalMaxLimit(parseInt(e.target.value))}
                  className="w-16 bg-white border border-surface-border rounded-lg px-2 py-1 text-center font-bold"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePreview}
                disabled={!selectedCycle || loadingPreview}
                className="flex items-center gap-2 bg-white border border-surface-border px-6 py-3 rounded-xl font-bold text-text-title hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Eye className="w-4 h-4 text-brand-primary" />
                Preview
              </button>
              <button 
                onClick={handleGenerate}
                disabled={!selectedCycle || generating}
                className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-current" />
                Generate All
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'requests' && (
          <div className="bg-white rounded-[32px] border border-surface-border shadow-sm overflow-hidden">
            <div className="p-8 border-b border-surface-border bg-surface-base/30">
              <h3 className="text-xl font-black text-text-title">Request Preview</h3>
              <p className="text-sm text-text-subtitle mt-1">Review evaluator assignments before publishing</p>
            </div>
            
            {loadingPreview ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mx-auto" />
                <p className="text-text-subtitle font-bold">Computing assignments based on rules...</p>
              </div>
            ) : previewData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-base/50">
                    <tr>
                      <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Target</th>
                      <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Evaluator</th>
                      <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Role</th>
                      <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {previewData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-base/30 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-bold text-text-title">{item.targetUserName}</div>
                          <div className="text-xs text-text-subtitle">{item.targetDepartmentName}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-text-title">{item.evaluatorName}</div>
                          <div className="text-xs text-text-subtitle">{item.evaluatorDepartmentName}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2 py-1 rounded-md bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase">
                            {item.relationship}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            {item.isAnonymous && <span className="text-[10px] text-green-600 font-bold">✓ Anonymous</span>}
                            {item.isReciprocalFallback && <span className="text-[10px] text-orange-600 font-bold">⚠ Reciprocal Fallback</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center text-text-subtitle italic">
                Select a cycle and click Preview to see results
              </div>
            )}
          </div>
        )}

        {activeTab === 'summaries' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-text-title">Cycle Summaries</h3>
              <button 
                onClick={() => selectedCycle && generateAllSummaries(parseInt(selectedCycle, 10))}
                className="flex items-center gap-2 bg-white border border-surface-border px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-md transition-all"
              >
                <RefreshCcw className="w-4 h-4 text-brand-primary" />
                Generate All Summaries
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingSummaries ? (
                [1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-surface-border" />)
              ) : summaries?.map((s) => (
                <div key={s.summaryId} className="bg-white p-6 rounded-[32px] border border-surface-border shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-text-title text-lg">{s.targetUserName}</h4>
                      <p className="text-xs text-text-subtitle font-bold uppercase tracking-widest">{s.cycleName}</p>
                    </div>
                    <div className="bg-brand-primary/10 text-brand-primary w-12 h-12 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-lg font-black leading-none">{s.totalAverageScore.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-surface-border flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      s.isFinalized ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {s.isFinalized ? 'Finalized' : 'Draft'}
                    </span>
                    {!s.isFinalized && (
                      <button 
                        onClick={() => finalizeSummary(s.summaryId)}
                        className="text-xs font-bold text-brand-primary hover:underline"
                      >
                        Finalize Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="bg-white rounded-[32px] border border-surface-border shadow-sm overflow-hidden">
            <div className="p-8 border-b border-surface-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-text-title tracking-tight">Department Limits</h3>
                <p className="text-sm text-text-subtitle mt-1">Define feedback boundaries per department & level</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Config
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-base/30">
                    <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Department</th>
                    <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Level</th>
                    <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest text-center">Peers (Min/Max)</th>
                    <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest text-center">Subs (Min/Max)</th>
                    <th className="px-8 py-4 text-xs font-black text-text-subtitle uppercase tracking-widest">Cross-Dept</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {configs?.map((c, i) => (
                    <tr key={i} className="hover:bg-surface-base/20 transition-colors">
                      <td className="px-8 py-5 font-bold text-text-title">{c.departmentName || 'N/A'}</td>
                      <td className="px-8 py-5 font-bold text-text-title">{c.levelName || 'N/A'}</td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-brand-primary">{c.minPeers}</span>
                        <span className="text-text-subtitle mx-2">-</span>
                        <span className="font-black text-brand-primary">{c.maxPeers}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-brand-primary">{c.minSubordinates}</span>
                        <span className="text-text-subtitle mx-2">-</span>
                        <span className="font-black text-brand-primary">{c.maxSubordinates}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          c.allowCrossDepartment ? 'bg-green-50 text-green-600' : 'bg-surface-border text-text-subtitle'
                        }`}>
                          {c.allowCrossDepartment ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Config Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-surface-border flex items-center justify-between bg-surface-base/30">
              <h3 className="text-2xl font-black text-text-title flex items-center gap-3">
                <Shield className="w-7 h-7 text-brand-primary" />
                Feedback Boundary Config
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <X className="w-6 h-6 text-text-subtitle" />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-text-subtitle uppercase tracking-widest mb-2">Department</label>
                  <select 
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 font-bold"
                  >
                    <option value="">Select Department</option>
                    {departments?.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-text-subtitle uppercase tracking-widest mb-2">Job Level</label>
                  <select 
                    value={formData.levelId}
                    onChange={(e) => setFormData({...formData, levelId: e.target.value})}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 font-bold"
                  >
                    <option value="">Select Level</option>
                    {allJobLevels?.map(l => <option key={l.levelId} value={l.levelId}>{l.levelName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-black text-text-title flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-primary" />
                    Peer Limits
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-subtitle block mb-1 uppercase">Min</label>
                      <input type="number" value={formData.minPeers} onChange={e => setFormData({...formData, minPeers: parseInt(e.target.value)})} className="w-full bg-surface-base border border-surface-border rounded-lg p-2 font-bold" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-subtitle block mb-1 uppercase">Max</label>
                      <input type="number" value={formData.maxPeers} onChange={e => setFormData({...formData, maxPeers: parseInt(e.target.value)})} className="w-full bg-surface-base border border-surface-border rounded-lg p-2 font-bold" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-black text-text-title flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-primary" />
                    Subordinate Limits
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-subtitle block mb-1 uppercase">Min</label>
                      <input type="number" value={formData.minSubordinates} onChange={e => setFormData({...formData, minSubordinates: parseInt(e.target.value)})} className="w-full bg-surface-base border border-surface-border rounded-lg p-2 font-bold" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-text-subtitle block mb-1 uppercase">Max</label>
                      <input type="number" value={formData.maxSubordinates} onChange={e => setFormData({...formData, maxSubordinates: parseInt(e.target.value)})} className="w-full bg-surface-base border border-surface-border rounded-lg p-2 font-bold" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-surface-base rounded-2xl">
                <input 
                  type="checkbox" 
                  checked={formData.allowCrossDepartment}
                  onChange={e => setFormData({...formData, allowCrossDepartment: e.target.checked})}
                  className="w-5 h-5 rounded border-surface-border text-brand-primary"
                />
                <span className="text-sm font-bold text-text-title">Allow evaluators from other departments</span>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-text-subtitle hover:bg-surface-base transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveConfig}
                  className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback360Admin;
