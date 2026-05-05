import React, { useState } from 'react';
import { X, Search, LayoutTemplate, CheckCircle2, Loader2 } from 'lucide-react';
import { useGetAllLibrariesQuery, useBulkAssignKpiMutation } from '../../services/kpiApi';
import { useActiveCycle } from '../../context/ActiveCycleContext';

interface BulkAssignModalProps {
  selectedEmployeeIds: number[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkAssignModal: React.FC<BulkAssignModalProps> = ({ selectedEmployeeIds, onClose, onSuccess }) => {
  const { activeCycleId } = useActiveCycle();
  const { data: librariesResponse, isLoading: loadingLibraries } = useGetAllLibrariesQuery();
  const [bulkAssign, { isLoading: isAssigning }] = useBulkAssignKpiMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<number | null>(null);

  const libraries = librariesResponse?.data || [];
  const filteredLibraries = libraries.filter(lib => 
    lib.isActive && (lib.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    lib.positionName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirm = async () => {
    if (!selectedLibraryId || !activeCycleId) return;
    
    try {
      await bulkAssign({
        employeeIds: selectedEmployeeIds,
        libraryId: selectedLibraryId,
        appraisalCycleId: activeCycleId
      }).unwrap();
      
      alert(`Successfully assigned template to ${selectedEmployeeIds.length} employees!`);
      onSuccess();
    } catch (err: any) {
      console.error('Bulk assignment failed:', err);
      alert(`Failed to assign: ${err?.data?.message || 'Network error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Bulk Goal Assignment</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Assigning to {selectedEmployeeIds.length} selected employees
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select KPI Template</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search templates by title or position..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingLibraries ? (
              <div className="col-span-2 py-10 flex justify-center italic text-gray-400">Loading templates...</div>
            ) : filteredLibraries.length === 0 ? (
              <div className="col-span-2 py-10 flex justify-center italic text-gray-400">No templates found</div>
            ) : (
              filteredLibraries.map(lib => (
                <div 
                  key={lib.id}
                  onClick={() => setSelectedLibraryId(lib.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                    selectedLibraryId === lib.id 
                    ? 'border-blue-600 bg-blue-50/30' 
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black text-gray-500 rounded uppercase tracking-widest group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {lib.positionName}
                    </span>
                    {selectedLibraryId === lib.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">{lib.title}</h4>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <LayoutTemplate className="w-3 h-3" />
                    {lib.details?.length || 0} KPI Items
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedLibraryId || isAssigning}
            className="px-8 py-3 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-black disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-all shadow-xl uppercase tracking-widest flex items-center gap-2"
          >
            {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAssignModal;
