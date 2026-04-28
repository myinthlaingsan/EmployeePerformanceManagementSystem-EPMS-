import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLibraryMutation, useGetCategoriesQuery } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetJobLevelsQuery } from '../../features/org/jobLevelApi';
import type { KpiLibraryDetailRequest, Priority } from '../../features/kpi/kpiTypes';

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

  const totalWeight = useMemo(() => details.reduce((sum, item) => sum + (item.weightPercent || 0), 0), [details]);

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
    if (totalWeight !== 100) {
      alert(`Total allocated weight must be exactly 100%. Current: ${totalWeight}%`);
      return;
    }
    if (details.some(d => d.weightPercent > 35)) {
      alert('Maximum weight per KPI item is 35%.');
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
    <div className="min-h-screen bg-[#F8F9FB] pb-20 animate-in fade-in duration-500">
      {/* Top Header Section */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <nav className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-2 flex gap-2">
          <span>KPI Library</span>
          <span>/</span>
          <span className="text-blue-600">New Entry</span>
        </nav>
        
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
          {/* Section 1: General Information */}
          <section className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex gap-4 mb-8">
              <div className="w-1 h-8 bg-[#0052CC] rounded-full"></div>
              <h2 className="text-xl font-black text-[#1A1C1E]">General Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Template Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Q1 Sales Performance Model"
                  className="w-full bg-[#F4F5F7] border-none rounded-xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target Position</label>
                <select
                  name="positionId"
                  value={formData.positionId}
                  onChange={handleInputChange}
                  className="w-full bg-[#F4F5F7] border-none rounded-xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value={0}>Select Position</option>
                  {positions.map(p => (
                    <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Performance Context Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the strategic impact and core expectations for this role's performance cycle..."
                  className="w-full bg-[#F4F5F7] border-none rounded-2xl px-5 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 transition resize-none placeholder-gray-300"
                />
              </div>
            </div>
          </section>

          {/* Section 2: KPI Definition Framework */}
          <section className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div className="flex gap-4">
                <div className="w-1 h-8 bg-[#0052CC] rounded-full"></div>
                <h2 className="text-xl font-black text-[#1A1C1E]">KPI Definition Framework</h2>
              </div>
              <button 
                onClick={addRow}
                className="text-[#0052CC] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition group"
              >
                <span className="text-lg bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">+</span> 
                Add Parameter Row
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F4F5F7]">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 text-center">#</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal Title</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Target Value</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-40 text-center">Weight (%)</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {details.map((detail, index) => (
                    <tr key={index} className="group hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-5 text-sm font-bold text-gray-400 text-center">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-5">
                        <input
                          type="text"
                          value={detail.goalTitle}
                          onChange={(e) => handleDetailChange(index, 'goalTitle', e.target.value)}
                          placeholder="Add next goal title..."
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-gray-700 placeholder-gray-300"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={detail.categoryId}
                          onChange={(e) => handleDetailChange(index, 'categoryId', e.target.value)}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-gray-500 appearance-none text-center"
                        >
                          <option value={0}>Select Category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                           <input
                            type="number"
                            value={detail.targetValue}
                            onChange={(e) => handleDetailChange(index, 'targetValue', e.target.value)}
                            placeholder="0"
                            className="w-12 bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-blue-600 placeholder-gray-300 text-center"
                          />
                          <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter bg-gray-100 px-1.5 py-0.5 rounded">UNIT</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <input
                          type="number"
                          value={detail.weightPercent}
                          onChange={(e) => handleDetailChange(index, 'weightPercent', e.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-gray-900 placeholder-gray-300 text-center"
                        />
                      </td>
                      <td className="px-6 py-5 text-center">
                        {details.length > 1 && (
                          <button onClick={() => removeRow(index)} className="text-gray-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8F9FB]">
                    <td colSpan={4} className="px-10 py-6 text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Allocated Weight</span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4 justify-center">
                        <span className={`text-lg font-black ${totalWeight === 100 ? 'text-blue-600' : 'text-red-600'}`}>
                          {totalWeight}%
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden w-24 hidden sm:block">
                          <div 
                            className={`h-full transition-all duration-500 ${totalWeight === 100 ? 'bg-blue-600' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(totalWeight, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-10 bg-[#E9F2FF] rounded-2xl p-6 flex items-start gap-5 border border-[#D0E4FF] shadow-sm">
              <div className="w-8 h-8 bg-[#0052CC] rounded-full flex items-center justify-center text-white font-bold italic shrink-0 shadow-md">i</div>
              <div>
                <h4 className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1">Spreadsheet Sync</h4>
                <p className="text-xs font-bold text-[#4C81CC] leading-relaxed">
                  Changes are auto-validated against role-level benchmarks. Use TAB to navigate cells quickly. 
                  Weights must sum to 100% and individual goals cannot exceed 35%.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default KpiLibraryEntry;
