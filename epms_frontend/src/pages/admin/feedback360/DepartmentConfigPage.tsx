import React, { useState } from 'react';
import {
  useGetFeedbackConfigsQuery,
  useSaveFeedbackConfigMutation,
  useDeleteFeedbackConfigMutation
} from '../../../features/feedback360/feedback360Api';
import { useGetDepartmentsQuery } from '../../../features/org/departmentApi';
import { useGetJobLevelsQuery, useGetJobLevelsByDepartmentQuery } from '../../../features/org/jobLevelApi';
import { useGetAppraisalFormSetsQuery } from '../../../features/appraisal/appraisalApi';
import { TieredConfigList } from '../../../components/feedback360/TieredConfigList';
import {
  Settings,
  Plus,
  X,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  ClipboardList
} from 'lucide-react';
import type { DepartmentFeedbackConfigDTO } from '../../../features/feedback360/feedback360Types';

const DepartmentConfigPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<DepartmentFeedbackConfigDTO | null>(null);
  
  const [formData, setFormData] = useState({
    departmentId: '',
    levelId: '',
    formSetId: '',
    minPeers: 2,
    maxPeers: 4,
    minSubordinates: 0,
    maxSubordinates: 5,
    allowCrossDepartment: false
  });

  const { data: configs, isLoading: loadingConfigs } = useGetFeedbackConfigsQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: allJobLevels } = useGetJobLevelsQuery();
  
  const { data: deptJobLevels, isLoading: loadingDeptLevels } = useGetJobLevelsByDepartmentQuery(
    parseInt(formData.departmentId, 10),
    { skip: !formData.departmentId }
  );
  const { data: formSets } = useGetAppraisalFormSetsQuery();

  const [saveConfig, { isLoading: isSaving }] = useSaveFeedbackConfigMutation();
  const [deleteConfig] = useDeleteFeedbackConfigMutation();

  const displayJobLevels = formData.departmentId ? deptJobLevels : allJobLevels;

  const handleEdit = (config: DepartmentFeedbackConfigDTO) => {
    setEditingConfig(config);
    setFormData({
      departmentId: config.departmentId?.toString() || '',
      levelId: config.levelId?.toString() || '',
      formSetId: config.formSetId?.toString() || '',
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
      formSetId: '',
      minPeers: 2,
      maxPeers: 4,
      minSubordinates: 0,
      maxSubordinates: 5,
      allowCrossDepartment: false
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.departmentId || !formData.levelId) {
      alert('Please select both Department and Job Level');
      return;
    }

    try {
      const payload: DepartmentFeedbackConfigDTO = {
        id: editingConfig?.id,
        departmentId: parseInt(formData.departmentId, 10),
        levelId: parseInt(formData.levelId, 10),
        formSetId: formData.formSetId ? parseInt(formData.formSetId, 10) : undefined,
        minPeers: formData.minPeers,
        maxPeers: formData.maxPeers,
        minSubordinates: formData.minSubordinates,
        maxSubordinates: formData.maxSubordinates,
        allowCrossDepartment: formData.allowCrossDepartment
      };

      await saveConfig(payload).unwrap();
      setIsModalOpen(false);
      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to save config:', err);
      alert('Failed to save configuration. It might already exist for this Department/Level combination.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await deleteConfig(id).unwrap();
      setSuccessMessage('Configuration deleted successfully');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Governance & Rules</p>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <Settings className="w-10 h-10 text-slate-300" />
            360° Department Rules
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Define specialized evaluator limits for specific organizational units.</p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Rule Override
        </button>
      </header>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-bold text-sm">{successMessage}</p>
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black text-slate-800">Active Overrides</h2>
        </div>

        {loadingConfigs ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <RefreshCcw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Configurations...</p>
          </div>
        ) : configs && configs.length > 0 ? (
          <TieredConfigList 
            configs={configs} 
            cycleStatus="PLANNING" 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <AlertCircle className="w-10 h-10 text-slate-200" />
             </div>
             <h3 className="text-xl font-black text-slate-400">No Custom Rules Defined</h3>
             <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm font-medium">All departments are currently following the Global Rules set in the Management Dashboard.</p>
          </div>
        )}
      </section>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                {editingConfig ? <Settings className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
                {editingConfig ? 'Edit Override' : 'New Rule Override'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                    <Building2 className="w-3 h-3" /> Target Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, levelId: '' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Department</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Job Level
                  </label>
                  <select
                    value={formData.levelId}
                    onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                    disabled={loadingDeptLevels}
                  >
                    <option value="">{loadingDeptLevels ? 'Loading levels...' : 'Select Level'}</option>
                    {displayJobLevels?.map(level => (
                      <option key={level.levelId} value={level.levelId}>{level.levelName} ({level.levelCode})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                    <ClipboardList className="w-3 h-3" /> Appraisal Form Set
                  </label>
                  <select
                    value={formData.formSetId}
                    onChange={(e) => setFormData({ ...formData, formSetId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select Form Set</option>
                    {formSets?.map(fs => (
                      <option key={fs.id} value={fs.id}>{fs.name} ({fs.cycleName})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium px-2">
                    This form set defines which questionnaires are used for Self, Peer, Manager, and Subordinate roles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-8 border-y border-slate-100">
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Peer Evaluation</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-black uppercase">Min</label>
                      <input
                        type="number"
                        value={formData.minPeers}
                        onChange={(e) => setFormData({ ...formData, minPeers: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-black uppercase">Max</label>
                      <input
                        type="number"
                        value={formData.maxPeers}
                        onChange={(e) => setFormData({ ...formData, maxPeers: parseInt(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {(() => {
                    const selectedLevelName = formData.levelId ? displayJobLevels?.find(l => l.levelId.toString() === formData.levelId)?.levelName : null;
                    const isJunior = selectedLevelName ? selectedLevelName.toLowerCase().includes('junior') : false;
                    
                    if (isJunior) return null;

                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">Subordinates</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-black uppercase">Min</label>
                            <input
                              type="number"
                              value={formData.minSubordinates}
                              onChange={(e) => setFormData({ ...formData, minSubordinates: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-black uppercase">Max</label>
                            <input
                              type="number"
                              value={formData.maxSubordinates}
                              onChange={(e) => setFormData({ ...formData, maxSubordinates: parseInt(e.target.value) || 0 })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>



              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <input
                  type="checkbox"
                  id="crossDept"
                  checked={formData.allowCrossDepartment}
                  onChange={(e) => setFormData({ ...formData, allowCrossDepartment: e.target.checked })}
                  className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="crossDept" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Allow Cross-Department Evaluations</label>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-900 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
              >
                {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Save Rule Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentConfigPage;
