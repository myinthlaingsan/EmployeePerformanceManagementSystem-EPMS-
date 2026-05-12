import React from 'react';
import { Settings, ArrowRight, Users, Shield, Trash2 } from 'lucide-react';
import type { DepartmentFeedbackConfigDTO } from '../../features/feedback360/feedback360Types';

interface ConfigListProps {
  configs: DepartmentFeedbackConfigDTO[];
  cycleStatus: string;
  onEdit: (config: DepartmentFeedbackConfigDTO) => void;
  onDelete: (id: number) => void;
}

export const TieredConfigList: React.FC<ConfigListProps> = ({ 
  configs, 
  cycleStatus, 
  onEdit, 
  onDelete 
}) => {
  const isLocked = cycleStatus === 'GENERATED' || cycleStatus === 'LOCKED' || cycleStatus === 'EVALUATION';

  return (
    <div className="grid grid-cols-1 gap-4">
      {configs?.map((config, index) => (
        <div key={config.id || `config-${index}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors group">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Settings className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-slate-900">{config.departmentName || 'Global'}</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
                <span className="text-lg font-medium text-slate-600">{config.levelName || 'All Levels'}</span>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-2">
                  <Users className="w-4 h-4" /> Peers: {config.maxPeers}
                </span>
                <span className="text-sm bg-slate-100 text-slate-600 px-3 py-1 rounded-full flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Subs: {config.maxSubordinates}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit(config)}
              disabled={isLocked}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-30"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onDelete(config.id)}
              disabled={isLocked}
              className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-30"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
