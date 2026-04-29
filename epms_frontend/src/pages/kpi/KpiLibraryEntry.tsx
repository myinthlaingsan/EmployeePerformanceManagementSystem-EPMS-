import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLibraryMutation, useGetCategoriesQuery } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import { validateKpiWeights } from '../../utils/kpiCalculations';
import type { Priority } from '../../features/kpi/kpiTypes';

const PRIORITY_WEIGHTS: Record<Priority, number> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 10,
  LOW: 5
};

interface FormKpiDetail extends KpiLibraryDetailRequest {
  priority: Priority;
}

// Sub-components
import LibraryBasicInfo from './components/LibraryBasicInfo';
import LibraryKpiTable from './components/LibraryKpiTable';
import LibrarySyncInfo from './components/LibrarySyncInfo';

const KpiLibraryEntry: React.FC = () => {
  const navigate = useNavigate();
  const [createLibrary, { isLoading: isSubmitting }] = useCreateLibraryMutation();
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: jobLevels = [] } = useGetJobLevelsQuery();
  const { data: categoriesResponse } = useGetCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    positionId: 0,
    targetLevelId: 0,
  });

  const [details, setDetails] = useState<FormKpiDetail[]>([
    { goalTitle: '', unit: '', targetValue: 0, weightPercent: 10, priority: 'MEDIUM', categoryId: 0 }
  ]);

  const { totalWeight, isValid, errors } = validateKpiWeights(details);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name.endsWith('Id') ? parseInt(value) : value });
  };

  const handleDetailChange = (index: number, field: keyof FormKpiDetail, value: any) => {
    const newDetails = [...details];
    let updatedItem = {
      ...newDetails[index],
      [field]: ['targetValue', 'weightPercent', 'categoryId'].includes(field as string) ? parseFloat(value) || 0 : value
    };

    // If priority changed, update weight automatically
    if (field === 'priority') {
      updatedItem.weightPercent = PRIORITY_WEIGHTS[value as Priority];
    }

    newDetails[index] = updatedItem;
    setDetails(newDetails);
  };

  const addRow = () => {
    setDetails([...details, { goalTitle: '', unit: '', targetValue: 0, weightPercent: 10, priority: 'MEDIUM', categoryId: 0 }]);
  };

  const removeRow = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!isValid) {
      alert(errors.join('\n'));
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
      console.error('Save failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-20 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto px-8 pt-8">
        {/* Navigation Breadcrumbs */}
        <nav className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2 flex gap-2">
          <span>KPI Library</span>
          <span>/</span>
          <span className="text-blue-600">New Entry</span>
        </nav>
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-[#1A1C1E] tracking-tight">Create New Library Entry</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-[#0052CC] text-white text-sm font-bold rounded-xl shadow-lg hover:bg-[#0747A6] transition disabled:opacity-50 active:scale-95 transform"
            >
              {isSubmitting ? 'Saving...' : 'Save to Library'}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <LibraryBasicInfo 
            formData={formData} 
            positions={positions} 
            jobLevels={jobLevels} 
            onChange={handleInputChange} 
          />

          <LibraryKpiTable 
            details={details}
            categories={categories}
            onDetailChange={handleDetailChange}
            onAddRow={addRow}
            onRemoveRow={removeRow}
            totalWeight={totalWeight}
          />

          <LibrarySyncInfo />
        </div>
      </div>
    </div>
  );
};

export default KpiLibraryEntry;
