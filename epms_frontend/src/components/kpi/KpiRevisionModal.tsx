import React, { useState } from 'react';
import { useReviseKpiMutation, useGetKpiCategoriesQuery } from '../../services/kpiApi';
import type { GoalItemResponse, Priority } from '../../features/kpi/kpiTypes';

interface KpiRevisionModalProps {
  item: GoalItemResponse;
  onClose: () => void;
}

const KpiRevisionModal: React.FC<KpiRevisionModalProps> = ({ item, onClose }) => {
  const [reviseKpi, { isLoading }] = useReviseKpiMutation();
  const { data: categoriesResponse } = useGetKpiCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [formData, setFormData] = useState({
    goalTitle: item.title,
    unit: item.unit || '',
    targetValue: item.targetValue,
    weightPercent: item.weightPercent,
    categoryId: item.categoryId || 0,
  });



  const [changeReason, setChangeReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason.trim()) {
      alert('Change reason is required for audit history.');
      return;
    }

    try {
      const updatedDetails = {
        ...formData,
        targetValue: (formData.targetValue as any) === '' ? 0 : formData.targetValue,
        weightPercent: (formData.weightPercent as any) === '' ? 0 : formData.weightPercent,
      };

      await reviseKpi({
        itemId: item.id,
        data: {
          changeReason,
          updatedDetails: updatedDetails as any,
        },
      }).unwrap();
      onClose();
    } catch (err: any) {
      console.error('Failed to revise KPI:', err);
      alert('Failed to revise KPI. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden transition-all">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Revise KPI Goal</h3>
            <p className="text-sm text-gray-500 mt-1">Modifications will be logged in the revision history.</p>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={formData.goalTitle}
                  onChange={(e) => setFormData({ ...formData, goalTitle: e.target.value })}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={0}>Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
                  ))}
                </select>
              </div>



              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Value</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={(formData.targetValue as any) === '' ? '' : formData.targetValue}
                  onKeyDown={e => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, targetValue: val === '' ? '' : Math.max(0, parseFloat(val)) } as any);
                  }}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-right"
                  style={{ textAlign: 'right' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max={35}
                  required
                  value={(formData.weightPercent as any) === '' ? '' : formData.weightPercent}
                  onKeyDown={e => {
                    if (e.key === '-') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, weightPercent: val === '' ? '' : Math.max(0, parseFloat(val)) } as any);
                  }}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-right"
                  style={{ textAlign: 'right' }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-bold text-red-600 mb-1">Reason for Revision *</label>
              <textarea
                required
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
                placeholder="Explain the reason for this change..."
                className="w-full border-red-100 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
              />
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
              {isLoading ? 'Applying...' : 'Apply Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiRevisionModal;
