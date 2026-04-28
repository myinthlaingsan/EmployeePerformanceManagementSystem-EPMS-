import React from 'react';
import type { KpiLibraryDetailRequest } from '../../../features/kpi/kpiTypes';

interface LibraryKpiTableProps {
  details: KpiLibraryDetailRequest[];
  categories: any[];
  onDetailChange: (index: number, field: keyof KpiLibraryDetailRequest, value: any) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  totalWeight: number;
}

const LibraryKpiTable: React.FC<LibraryKpiTableProps> = ({ 
  details, 
  categories, 
  onDetailChange, 
  onAddRow, 
  onRemoveRow,
  totalWeight 
}) => {
  return (
    <section className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <div className="w-1 h-8 bg-[#0052CC] rounded-full"></div>
          <h2 className="text-xl font-black text-[#1A1C1E]">KPI Definition Framework</h2>
        </div>
        <button 
          onClick={onAddRow}
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
                    onChange={(e) => onDetailChange(index, 'goalTitle', e.target.value)}
                    placeholder="Add next goal title..."
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-gray-700 placeholder-gray-300"
                  />
                </td>
                <td className="px-6 py-5">
                  <select
                    value={detail.categoryId}
                    onChange={(e) => onDetailChange(index, 'categoryId', e.target.value)}
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
                      onChange={(e) => onDetailChange(index, 'targetValue', e.target.value)}
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
                    onChange={(e) => onDetailChange(index, 'weightPercent', e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-gray-900 placeholder-gray-300 text-center"
                  />
                </td>
                <td className="px-6 py-5 text-center">
                  {details.length > 1 && (
                    <button onClick={() => onRemoveRow(index)} className="text-gray-200 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
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
    </section>
  );
};

export default LibraryKpiTable;
