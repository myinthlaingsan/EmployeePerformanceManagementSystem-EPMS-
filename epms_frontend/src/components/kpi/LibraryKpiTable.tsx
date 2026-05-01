import React from 'react';

interface LibraryKpiTableProps {
  details: any[];
  categories: any[];
  onDetailChange: (index: number, field: string, value: any) => void;
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
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">KPI Items</h2>
        <button
          onClick={onAddRow}
          className="text-blue-600 text-sm font-bold hover:text-blue-700 transition flex items-center gap-1"
        >
          <span>+ Add KPI Row</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-12 text-center">#</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Goal Title</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Target</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Priority</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center w-32">Weight (%)</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {details.map((detail, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400 text-center">
                  {index + 1}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={detail.goalTitle}
                    onChange={(e) => onDetailChange(index, 'goalTitle', e.target.value)}
                    placeholder="Enter goal..."
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-700 placeholder-gray-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={detail.categoryId}
                    onChange={(e) => onDetailChange(index, 'categoryId', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-600 cursor-pointer"
                  >
                    <option value={0}>Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="number"
                      value={detail.targetValue}
                      onChange={(e) => onDetailChange(index, 'targetValue', e.target.value)}
                      className="w-12 bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-blue-600 text-center"
                    />
                    <span className="text-[10px] font-bold text-gray-300 uppercase">Unit</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={detail.priority}
                    onChange={(e) => onDetailChange(index, 'priority', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-semibold text-center cursor-pointer"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Lower</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={detail.weightPercent}
                    onChange={(e) => onDetailChange(index, 'weightPercent', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-gray-900 text-center"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {details.length > 1 && (
                    <button onClick={() => onRemoveRow(index)} className="text-gray-300 hover:text-red-500 transition">
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold border-t border-gray-100">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">
                Total Allocated Weight
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`text-sm ${totalWeight === 100 ? 'text-blue-600' : 'text-red-600'}`}>
                  {totalWeight}%
                </span>
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
