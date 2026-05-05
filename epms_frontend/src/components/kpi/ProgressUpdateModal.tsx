import React, { useState } from 'react';
import { useUpdateProgressMutation } from '../../services/kpiApi';
import type { GoalItemResponse } from '../../features/kpi/kpiTypes';

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Update Progress</h3>
            <p className="text-sm text-gray-500 mt-1">{item.title}</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Actual Value ({item.unit || 'units'})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  required
                  value={actualValue}
                  onChange={(e) => setActualValue(parseFloat(e.target.value))}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="text-sm font-bold text-gray-400">/ {item.targetValue}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Evidence / Notes</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Achievement details..."
                className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-blue-700">Calculated Completion</span>
                <span className="text-blue-700">
                  {Math.round((actualValue / item.targetValue) * 100)}%
                </span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min((actualValue / item.targetValue) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
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
