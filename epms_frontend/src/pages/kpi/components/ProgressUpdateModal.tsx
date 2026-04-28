import React, { useState } from 'react';
import { useUpdateProgressMutation } from '../../../features/kpi/kpiApi';
import type { GoalItemResponse } from '../../../features/kpi/kpiTypes';

interface ProgressUpdateModalProps {
  item: GoalItemResponse;
  onClose: () => void;
}

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({ item, onClose }) => {
  const [updateProgress, { isLoading }] = useUpdateProgressMutation();
  const [actualValue, setActualValue] = useState<number>(item.currentProgress || 0);
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const progressPercent = (actualValue / item.targetValue) * 100;
      await updateProgress({
        goalItemId: item.id,
        actualValue,
        progressPercent: Math.min(progressPercent, 100),
        evidenceNote: note,
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to update progress:', err);
      alert('Failed to update progress');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Update Progress</h3>
            <p className="text-sm text-gray-500 mt-1">{item.title}</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actual Value ({item.unit || 'units'})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  value={actualValue}
                  onChange={(e) => setActualValue(parseFloat(e.target.value))}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
                <span className="text-sm font-medium text-gray-500">/ {item.targetValue}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence / Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Briefly describe your achievement or attach evidence link..."
                className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Calculated Progress</span>
                    <span className="font-bold text-blue-600">
                        {Math.round((actualValue / item.targetValue) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min((actualValue / item.targetValue) * 100, 100)}%` }}
                    />
                </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;
