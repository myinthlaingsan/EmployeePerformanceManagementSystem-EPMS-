import React from "react";

interface LibraryKpiTableProps {
  details: any[];
  categories?: any[];
  onDetailChange?: (index: number, field: string, value: any) => void;
  onAddRow?: () => void;
  onRemoveRow?: (index: number) => void;
  totalWeight?: number;
  isReadOnly?: boolean;
}

const LibraryKpiTable: React.FC<LibraryKpiTableProps> = ({
  details,
  categories = [],
  onDetailChange = () => {},
  onAddRow = () => {},
  onRemoveRow = () => {},
  totalWeight = 0,
  isReadOnly = false,
}) => {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <h2 className="text-lg font-bold text-gray-900">KPI Items</h2>
        {!isReadOnly && (
          <button
            onClick={onAddRow}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 transition-colors"
          >
            + Add Row
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b-2 border-gray-800">
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-1/3">
                KPI
              </th>
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-1/5">
                Category
              </th>
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-24">
                Target
              </th>
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-40">
                Unit
              </th>
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-24">
                Weight (%)
              </th>
              <th className="px-3 py-2 text-sm font-bold text-gray-900 border-r border-gray-200 text-center w-20">
                Compliance
              </th>
              {!isReadOnly && <th className="w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {details.map((detail, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 hover:bg-gray-50 focus-within:bg-blue-50/20 transition-colors"
              >
                <td className="border-r border-gray-200 p-0">
                  <input
                    type="text"
                    id={`goalTitle-${index}`}
                    name={`goalTitle-${index}`}
                    value={detail.goalTitle}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onDetailChange(index, "goalTitle", e.target.value)
                    }
                    placeholder="Enter KPI description"
                    className={`w-full h-full min-h-10 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 px-3 py-2 text-sm text-gray-900 ${isReadOnly ? "cursor-default" : ""}`}
                  />
                </td>
                <td className="border-r border-gray-200 p-0">
                  <select
                    id={`categoryId-${index}`}
                    name={`categoryId-${index}`}
                    value={detail.categoryId}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onDetailChange(index, "categoryId", e.target.value)
                    }
                    className={`w-full h-full min-h-10 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 px-3 py-2 text-sm text-gray-900 cursor-pointer appearance-none ${isReadOnly ? "cursor-default" : ""}`}
                  >
                    {!isReadOnly && (
                      <option value={0}>Select Category...</option>
                    )}
                    {isReadOnly && detail.categoryName && (
                      <option value={detail.categoryId}>
                        {detail.categoryName}
                      </option>
                    )}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.categoryName || c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-r border-gray-200 p-0">
                  <input
                    type="number"
                    min="0"
                    // value={detail.targetValue === "" ? "" : detail.targetValue}
                    id={`targetValue-${index}`}
                    name={`targetValue-${index}`}
                    value={detail.targetValue}
                    disabled={detail.isCompliance || isReadOnly}
                    onKeyDown={(e) => {
                      if (e.key === "-") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) =>
                      onDetailChange(index, "targetValue", e.target.value)
                    }
                    className={`w-full h-full min-h-10 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 px-3 py-2 text-sm text-right font-medium ${detail.isCompliance || isReadOnly ? "text-gray-400 bg-gray-50/50" : "text-gray-900"}`}
                  />
                </td>
                <td className="border-r border-gray-200 p-0">
                  <input
                    type="text"
                    id={`unit-${index}`}
                    name={`unit-${index}`}
                    value={detail.unit}
                    disabled={isReadOnly}
                    onChange={(e) =>
                      onDetailChange(index, "unit", e.target.value)
                    }
                    placeholder="e.g., %, Days"
                    className={`w-full h-full min-h-10 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 px-3 py-2 text-sm text-gray-900 ${isReadOnly ? "cursor-default" : ""}`}
                  />
                </td>
                <td className="border-r border-gray-200 p-0">
                  <input
                    type="number"
                    id={`weightPercent-${index}`}
                    name={`weightPercent-${index}`}
                    value={detail.weightPercent}
                    disabled={isReadOnly}
                    onChange={(e) => onDetailChange(index, 'weightPercent', e.target.value)}
                    className={`w-full h-full min-h-10 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-blue-500 px-3 py-2 text-sm text-gray-900 text-right font-bold ${isReadOnly ? 'cursor-default' : ''}`}
                  />
                </td>
                <td className="border-r border-gray-200 p-0 text-center align-middle">
                   <div className="flex items-center justify-center h-full">
                     <input
                       type="checkbox"
                       id={`isCompliance-${index}`}
                       name={`isCompliance-${index}`}
                       checked={detail.isCompliance || false}
                       disabled={isReadOnly}
                       onChange={(e) => onDetailChange(index, 'isCompliance', e.target.checked)}
                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-default"
                       title="Flag as Pass/Fail Compliance KPI"
                     />
                    </div>
                 </td>
                 {!isReadOnly && (
                   <td className="p-0 text-center">
                     {details.length > 1 && (
                       <button 
                         onClick={() => onRemoveRow(index)} 
                         className="w-full h-full min-h-10 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                         title="Remove Row"
                       >
                         ✕
                       </button>
                     )}
                   </td>
                 )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-800">
            <tr>
              <td
                colSpan={5}
                className="px-3 py-2 text-right text-sm font-bold text-gray-900 border-r border-gray-200"
              >
                Total Score
              </td>
              <td className="px-3 py-2 text-right border-r border-gray-200">
                <span
                  className={`text-sm font-bold ${totalWeight === 100 ? "text-gray-900" : "text-red-600"}`}
                >
                  {totalWeight}
                </span>
              </td>
              {!isReadOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

export default LibraryKpiTable;
