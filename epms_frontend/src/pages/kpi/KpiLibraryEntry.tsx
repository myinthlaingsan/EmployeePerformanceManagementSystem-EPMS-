import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLibraryMutation, useGetCategoriesQuery } from '../../services/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import { validateKpiWeights } from '../../utils/kpiCalculations';
import type { Priority, KpiLibraryDetailRequest } from '../../features/kpi/kpiTypes';

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
import LibraryBasicInfo from '../../components/kpi/LibraryBasicInfo';
import LibraryKpiTable from '../../components/kpi/LibraryKpiTable';
import LibrarySyncInfo from '../../components/kpi/LibrarySyncInfo';

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Library Entry</h1>
          <p className="text-gray-600 mt-1">Configure a new KPI performance template.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
  );
};

export default KpiLibraryEntry;
