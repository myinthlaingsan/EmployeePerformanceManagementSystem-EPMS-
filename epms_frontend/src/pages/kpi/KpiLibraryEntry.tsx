import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  useCreateLibraryMutation, 
  useUpdateLibraryMutation,
  useGetKpiCategoriesQuery,
  useGetLibraryByIdQuery 
} from '../../services/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import { validateKpiWeights } from '../../utils/kpiCalculations';
import type { KpiLibraryDetailRequest } from '../../features/kpi/kpiTypes';

// Sub-components
import LibraryBasicInfo from '../../components/kpi/LibraryBasicInfo';
import LibraryKpiTable from '../../components/kpi/LibraryKpiTable';
import LibrarySyncInfo from '../../components/kpi/LibrarySyncInfo';

interface FormKpiDetail extends KpiLibraryDetailRequest {}

const KpiLibraryEntry: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [createLibrary, { isLoading: isCreating }] = useCreateLibraryMutation();
  const [updateLibrary, { isLoading: isUpdating }] = useUpdateLibraryMutation();
  
  const { data: libraryData, isLoading: libraryLoading } = useGetLibraryByIdQuery(parseInt(id || '0'), {
    skip: !isEdit
  });
  
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: jobLevels = [] } = useGetJobLevelsQuery();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetKpiCategoriesQuery();
  const categories = categoriesResponse?.data || [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    positionId: 0,
    targetLevelId: 0,
  });

  const [details, setDetails] = useState<FormKpiDetail[]>([
    { goalTitle: '', unit: '', targetValue: 0, weightPercent: 5, categoryId: 0 }
  ]);

  // Populate data if in edit mode
  useEffect(() => {
    if (isEdit && libraryData?.data) {
      const lib = libraryData.data;
      console.log('--- DEBUG: KPI Library Fetch ---');
      console.log('Library Data:', lib);
      console.log('Current Positions in state:', positions);
      
      setFormData({
        title: lib.title || '',
        description: lib.description || '',
        positionId: Number(lib.positionId) || 0,
        targetLevelId: Number(lib.targetLevelId) || 0,
      });

      if (lib.details && lib.details.length > 0) {
        setDetails(lib.details.map(d => ({
          goalTitle: d.goalTitle || '',
          unit: d.unit || '',
          targetValue: Number(d.targetValue) || 0,
          weightPercent: Number(d.weightPercent) || 0,
          categoryId: Number(d.categoryId) || 0
        })));
      }
    }
  }, [isEdit, libraryData, positions.length]); // Added positions.length as dependency to ensure re-sync when options load

  const { totalWeight, isValid, errors } = validateKpiWeights(details);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name.endsWith('Id') ? parseInt(value) : value });
  };

  const handleDetailChange = (index: number, field: keyof FormKpiDetail, value: any) => {
    const newDetails = [...details];
    let updatedItem = {
      ...newDetails[index],
      [field]: field === 'categoryId' ? parseInt(value) || 0 : ['targetValue', 'weightPercent'].includes(field as string) ? parseFloat(value) || 0 : value
    };

    newDetails[index] = updatedItem;
    setDetails(newDetails);
  };

  const addRow = () => {
    setDetails([...details, { goalTitle: '', unit: '', targetValue: 0, weightPercent: 10, categoryId: 0 }]);
  };

  const removeRow = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Please enter a Template Title.");
      return;
    }
    if (formData.positionId === 0) {
      alert("Please select a Target Position.");
      return;
    }
    
    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      if (!d.goalTitle.trim()) {
        alert(`KPI row ${i + 1}: Please enter a KPI description.`);
        return;
      }
      if (d.categoryId === 0) {
        alert(`KPI row ${i + 1}: Please select a Category.`);
        return;
      }
      if (d.targetValue <= 0) {
        alert(`KPI row ${i + 1}: Target value must be greater than 0.`);
        return;
      }
      if (!d.unit.trim()) {
        alert(`KPI row ${i + 1}: Please enter a Unit.`);
        return;
      }
    }

    if (!isValid) {
      alert(errors.join('\n'));
      return;
    }

    try {
      const payload = {
        ...formData,
        details: details,
      };

      if (isEdit) {
        await updateLibrary({ id: parseInt(id!), data: payload }).unwrap();
      } else {
        await createLibrary(payload).unwrap();
      }
      navigate('/kpi/library');
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(err?.data?.message || err?.data?.error || 'Failed to save template. Please check your inputs.');
    }
  };

  if (isEdit && libraryLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 uppercase tracking-wider transition-colors"
      >
        ← Back to Library
      </button>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {isEdit ? 'Edit Library Entry' : 'Create Library Entry'}
          </h1>
          <p className="text-gray-400 text-sm font-medium max-w-xl leading-relaxed">
            {isEdit ? 'Update the existing KPI performance template.' : 'Configure a new KPI performance template.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isCreating || isUpdating}
            className="px-8 py-3 bg-[#2563EB] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 active:scale-95"
          >
            {isCreating || isUpdating ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
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
