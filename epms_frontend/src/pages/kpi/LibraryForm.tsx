import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLibraryMutation, useGetCategoriesQuery } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import type { KpiLibraryDetailRequest, Priority } from '../../features/kpi/kpiTypes';

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 10,
  LOW: 5
};

interface FormKpiDetail extends KpiLibraryDetailRequest {
  priority: Priority;
}

const LibraryForm: React.FC = () => {
  const navigate = useNavigate();
  const [createLibrary, { isLoading: isSubmitting }] = useCreateLibraryMutation();
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    positionId: 0,
  });

  const [details, setDetails] = useState<FormKpiDetail[]>([
    { goalTitle: '', unit: '', targetValue: 0, weightPercent: 10, priority: 'MEDIUM', categoryId: 0 }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'positionId' ? parseInt(value) : value });
  };

  const handleDetailChange = (index: number, field: keyof FormKpiDetail, value: any) => {
    const newDetails = [...details];
    let updatedItem = {
      ...newDetails[index],
      [field]: field === 'targetValue' || field === 'weightPercent' || field === 'categoryId' ? parseFloat(value) : value
    };

    // If priority changed, update weight automatically
    if (field === 'priority') {
      updatedItem.weightPercent = PRIORITY_WEIGHTS[value as Priority];
    }

    newDetails[index] = updatedItem;
    setDetails(newDetails);
  };

  const addDetail = () => {
    setDetails([...details, { goalTitle: '', unit: '', targetValue: 0, weightPercent: 10, priority: 'MEDIUM', categoryId: 0 }]);
  };

  const removeDetail = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalWeight = details.reduce((sum, item) => sum + item.weightPercent, 0);
    if (totalWeight !== 100) {
      alert(`Total weight must be 100%. Current total: ${totalWeight}%`);
      return;
    }

    if (details.some(item => item.weightPercent > 35)) {
      alert('Each KPI item weight cannot exceed 35%');
      return;
    }

    try {
      // Remove priority field before sending to backend
      const backendDetails = details.map(({ priority, ...rest }) => rest);
      
      await createLibrary({
        ...formData,
        details: backendDetails,
      }).unwrap();
      navigate('/kpi/library');
    } catch (err) {
      console.error('Failed to create library:', err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create KPI Library Template</h1>
        <button
          onClick={() => navigate('/kpi/library')}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Sales Executive Standard KPIs"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Position</label>
              <select
                name="positionId"
                required
                value={formData.positionId}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>Select Position</option>
                {positions.map(p => (
                  <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Details / Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">KPI Items</h2>
            <button
              type="button"
              onClick={addDetail}
              className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition"
            >
              + Add KPI Item
            </button>
          </div>

          {details.map((detail, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
              {details.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDetail(index)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    value={detail.goalTitle}
                    onChange={(e) => handleDetailChange(index, 'goalTitle', e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    required
                    value={detail.categoryId}
                    onChange={(e) => handleDetailChange(index, 'categoryId', e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                  <input
                    type="number"
                    required
                    value={detail.targetValue}
                    onChange={(e) => handleDetailChange(index, 'targetValue', e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={detail.unit}
                    onChange={(e) => handleDetailChange(index, 'unit', e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. %, USD, Count"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
                  <input
                    type="number"
                    max={100}
                    required
                    value={detail.weightPercent}
                    onChange={(e) => handleDetailChange(index, 'weightPercent', e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={detail.priority}
                    onChange={(e) => handleDetailChange(index, 'priority', e.target.value as Priority)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-sm font-medium text-gray-600">
              Total Weight: <span className={details.reduce((s, i) => s + i.weightPercent, 0) === 100 ? 'text-green-600' : 'text-red-600'}>
                {details.reduce((s, i) => s + i.weightPercent, 0)}%
              </span> / 100%
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/kpi/library')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LibraryForm;
