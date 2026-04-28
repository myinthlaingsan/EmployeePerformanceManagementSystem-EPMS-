import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLibraryMutation, useGetCategoriesQuery } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import type { KpiLibraryDetailRequest } from '../../features/kpi/kpiTypes';
import { validateKpiWeights } from '../../utils/kpiCalculations';

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

  const [details, setDetails] = useState<KpiLibraryDetailRequest[]>([
    { goalTitle: '', unit: '', targetValue: 0, weightPercent: 0, priority: 'MEDIUM', categoryId: 0 }
  ]);

  const { totalWeight, isValid, errors } = validateKpiWeights(details);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name.endsWith('Id') ? parseInt(value) : value });
  };

  const handleDetailChange = (index: number, field: keyof KpiLibraryDetailRequest, value: any) => {
    const newDetails = [...details];
    newDetails[index] = {
      ...newDetails[index],
      [field]: ['targetValue', 'weightPercent', 'categoryId'].includes(field) ? parseFloat(value) || 0 : value
    };
    setDetails(newDetails);
  };

  const addRow = () => {
    setDetails([...details, { goalTitle: '', unit: '', targetValue: 0, weightPercent: 0, priority: 'MEDIUM', categoryId: 0 }]);
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
      await createLibrary({
        ...formData,
        details,
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
