import React, { useState } from 'react';
import { useReviseKpiMutation, useGetCategoriesQuery } from '../../../features/kpi/kpiApi';
import type { GoalItemResponse, Priority } from '../../../features/kpi/kpiTypes';

interface KpiRevisionModalProps {
  item: GoalItemResponse;
  onClose: () => void;
}

const KpiRevisionModal: React.FC<KpiRevisionModalProps> = ({ item, onClose }) => {
  const [reviseKpi, { isLoading }] = useReviseKpiMutation();
  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [formData, setFormData] = useState({
    goalTitle: item.title,
    unit: item.unit || '',
    targetValue: item.targetValue,
    weightPercent: item.weightPercent,
    priority: (item.priority as Priority) || 'MEDIUM',
    categoryId: 0, // Should ideally map from item.categoryName
  });

  const [changeReason, setChangeReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason.trim()) {
      alert('Change reason is required for audit history.');
      return;
    }

    try {
      await reviseKpi({
        itemId: item.id,
        data: {
          changeReason,
          updatedDetails: formData,
        },
      }).unwrap();
      onClose();
    } catch (err) {
      console.error('Failed to revise KPI:', err);
      alert('Failed to revise KPI');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">Revise KPI Goal</h3>
            <p className="text-sm text-gray-500 mt-1">Changes will be logged in the revision history.</p>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={formData.goalTitle}
                  onChange={(e) => setFormData({ ...formData, goalTitle: e.target.value })}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value={0}>Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                <input
                  type="number"
                  required
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
                <input
                  type="number"
                  max={35}
                  required
                  value={formData.weightPercent}
                  onChange={(e) => setFormData({ ...formData, weightPercent: parseFloat(e.target.value) })}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-red-700 mb-1">Reason for Revision *</label>
              <textarea
                required
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                placeholder="Explain why this KPI is being modified..."
                className="w-full border-red-200 bg-red-50 rounded-xl focus:ring-red-500 focus:border-red-500 shadow-sm"
              />
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
              {isLoading ? 'Saving Revision...' : 'Apply Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiRevisionModal;
