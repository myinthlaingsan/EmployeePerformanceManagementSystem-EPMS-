import React, { useState } from 'react';
import { 
  useGetFeedbackConfigsQuery, 
  useGenerateFeedbackRequestsMutation,
  useUpdateFeedbackConfigMutation
} from '../../features/feedback360/feedback360Api';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetJobLevelsQuery, useGetJobLevelsByDepartmentQuery } from '../../features/org/jobLevelApi';
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
  X
} from 'lucide-react';

const FeedbackAdminDashboard: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    departmentId: '',
    levelId: '',
    minPeers: 2,
    maxPeers: 4,
    minSubordinates: 0,
    maxSubordinates: 5,
    allowCrossDepartment: false
  });

  const { data: configs, isLoading: loadingConfigs } = useGetFeedbackConfigsQuery();
  const { data: cycles } = useGetCyclesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: allJobLevels } = useGetJobLevelsQuery();
  const { data: deptJobLevels, isLoading: loadingDeptLevels } = useGetJobLevelsByDepartmentQuery(
    parseInt(formData.departmentId, 10),
    { skip: !formData.departmentId }
  );

  const displayJobLevels = formData.departmentId ? deptJobLevels : allJobLevels;

  const [generateRequests, { isLoading: generating }] = useGenerateFeedbackRequestsMutation();
  const [updateConfig, { isLoading: updating }] = useUpdateFeedbackConfigMutation();

  const handleGenerate = async () => {
    if (!selectedCycle) return;
    try {
      await generateRequests({ cycleId: parseInt(selectedCycle, 10) }).unwrap();
      setSuccessMessage('Feedback requests generated successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to generate requests:', err);
    }
  };

  const handleEditConfig = (config: any) => {
    setEditingConfig(config);
    setFormData({
      departmentId: config.departmentId?.toString() || '',
      levelId: config.levelId?.toString() || '',
      minPeers: config.minPeers || 2,
      maxPeers: config.maxPeers || 4,
      minSubordinates: config.minSubordinates || 0,
      maxSubordinates: config.maxSubordinates || 5,
      allowCrossDepartment: config.allowCrossDepartment || false
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingConfig(null);
    setFormData({
      departmentId: '',
      levelId: '',
      minPeers: 2,
      maxPeers: 4,
      minSubordinates: 0,
      maxSubordinates: 5,
      allowCrossDepartment: false
    });
    setIsModalOpen(true);
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
      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <header>
        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">Administrative Control</p>
        <h1 className="text-4xl font-bold text-text-title tracking-tight">360° Feedback Management</h1>
        <p className="text-text-muted mt-2 font-medium">Configure evaluation rules, generate requests, and monitor overall progress.</p>
      </header>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-bold text-sm">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Panel */}
        <section className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-text-title">Request Generation</h2>
          </div>
          
          <p className="text-sm text-text-muted leading-relaxed">
            Trigger the automated generation of 360-degree feedback requests based on organizational hierarchy and anti-reciprocity rules.
          </p>

          <div className="space-y-4 pt-4">
            <div>
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block mb-2">Select Appraisal Cycle</label>
              <select 
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-text-title focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
              >
                <option value="">Choose a cycle...</option>
                {Array.isArray(cycles) ? cycles.map(cycle => (
                  <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                )) : (cycles as any)?.data?.map((cycle: any) => (
                  <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedCycle || generating}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Requests
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 text-amber-700">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Generation uses current organizational structure. Ensure all departments and reporting lines are up to date before proceeding.
            </p>
          </div>
        </section>

        {/* Configurations & Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Configs List */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-text-title tracking-tight">System Configurations</h2>
               </div>
               <button 
                 onClick={handleAddNew}
                 className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary/20 transition-colors"
               >
                 <Plus className="w-4 h-4" />
                 Add New
               </button>
            </div>

            <div className="space-y-4">
              {loadingConfigs ? (
                <div className="py-10 text-center text-text-muted">Loading settings...</div>
              ) : Array.isArray(configs) && configs.length > 0 ? configs.map((config, idx) => (
                <div key={config.id || `${config.departmentId}-${config.levelId}-${idx}`} className="flex items-center justify-between p-5 bg-surface-base rounded-2xl border border-surface-border group hover:border-brand-primary transition-all">
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="font-bold text-text-title text-sm">{config.departmentName || 'Global Settings'}</p>
                       {config.levelName && (
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                           {config.levelName}
                         </span>
                       )}
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">
                      Peers: {config.minPeers}-{config.maxPeers} | Subs: {config.minSubordinates}-{config.maxSubordinates}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleEditConfig(config)}
                    className="bg-white px-4 py-2 rounded-lg text-xs font-bold text-text-title border border-surface-border hover:bg-gray-50 shadow-sm transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )) : (
                <div className="py-10 text-center text-text-muted italic border-2 border-dashed border-surface-border rounded-[2rem]">
                  No configurations found. Click "Add New" to create organizational rules.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[3rem] border border-surface-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-8 border-b border-surface-border">
              <h3 className="text-2xl font-bold text-text-title">
                {editingConfig ? 'Edit Configuration' : 'New Configuration'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-surface-base flex items-center justify-center text-text-muted hover:text-text-title transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Department</label>
                  <select 
                    value={formData.departmentId}
                    onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-text-title outline-none focus:ring-2 focus:ring-brand-primary/20"
                  >
                    <option value="">Global (All Departments)</option>
                    {departments?.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Job Level</label>
                  <select 
                    value={formData.levelId}
                    onChange={(e) => setFormData({...formData, levelId: e.target.value})}
                    className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-text-title outline-none focus:ring-2 focus:ring-brand-primary/20"
                    disabled={loadingDeptLevels}
                  >
                    <option value="">{loadingDeptLevels ? 'Loading levels...' : 'All Levels'}</option>
                    {displayJobLevels?.map(level => (
                      <option key={level.levelId} value={level.levelId}>{level.levelName} ({level.levelCode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-4 border-y border-surface-border">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Peer Evaluation Limits</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold">Min</label>
                      <input 
                        type="number" 
                        value={formData.minPeers}
                        onChange={(e) => setFormData({...formData, minPeers: parseInt(e.target.value)})}
                        className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold">Max</label>
                      <input 
                        type="number" 
                        value={formData.maxPeers}
                        onChange={(e) => setFormData({...formData, maxPeers: parseInt(e.target.value)})}
                        className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Subordinate Limits</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold">Min</label>
                      <input 
                        type="number" 
                        value={formData.minSubordinates}
                        onChange={(e) => setFormData({...formData, minSubordinates: parseInt(e.target.value)})}
                        className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-text-muted font-bold">Max</label>
                      <input 
                        type="number" 
                        value={formData.maxSubordinates}
                        onChange={(e) => setFormData({...formData, maxSubordinates: parseInt(e.target.value)})}
                        className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="crossDept"
                  checked={formData.allowCrossDepartment}
                  onChange={(e) => setFormData({...formData, allowCrossDepartment: e.target.checked})}
                  className="w-5 h-5 rounded-lg border-surface-border text-brand-primary focus:ring-brand-primary/20"
                />
                <label htmlFor="crossDept" className="text-sm font-bold text-text-title">Allow Cross-Department Evaluations</label>
              </div>
            </div>

            <div className="p-8 bg-surface-base border-t border-surface-border flex items-center justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm text-text-muted hover:text-text-title transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveConfig}
                disabled={updating}
                className="bg-brand-primary text-white px-10 py-3 rounded-xl font-bold text-sm shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <RefreshCcw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackAdminDashboard;
