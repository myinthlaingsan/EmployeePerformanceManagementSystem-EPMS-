import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetEmployeesQuery
} from '../../features/employee/employeeapi';
import {
  useGetAllLibrariesQuery,
  useAssignKpiToEmployeeMutation
} from '../../services/kpiApi';

const GoalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading: loadingEmployees } = useGetEmployeesQuery();
  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const [assignKpi] = useAssignKpiToEmployeeMutation();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedLibraryId, setSelectedLibraryId] = useState<number>(0);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const handleAssign = async () => {
    if (!selectedEmployeeId || selectedLibraryId === 0) return;

    try {
      await assignKpi({
        employeeId: selectedEmployeeId,
        libraryId: selectedLibraryId,
        appraisalCycleId: 1, // Placeholder for now
      }).unwrap();
      setShowAssignModal(false);
      setSelectedEmployeeId(null);
      setSelectedLibraryId(0);
      alert('KPI successfully assigned!');
    } catch (err) {
      console.error('Failed to assign KPI:', err);
      alert('Failed to assign KPI. Please try again.');
    }
  };

  if (loadingEmployees) return <div className="p-6">Loading employees...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Goal Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">{emp.staffName}</div>
                  <div className="text-xs text-gray-500">{emp.employeeCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {emp.positionName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setShowAssignModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-4 font-semibold"
                  >
                    Assign KPI
                  </button>
                  <button
                    onClick={() => navigate(`/kpi/goals/${emp.id}`)}
                    className="text-gray-600 hover:text-gray-800 font-semibold"
                  >
                    View Goals
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden transition-all">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Assign KPI Library</h3>
              <p className="text-sm text-gray-500 mt-1">Select a template to assign to the employee.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select KPI Template</label>
                <select
                  value={selectedLibraryId}
                  onChange={(e) => setSelectedLibraryId(parseInt(e.target.value))}
                  className="w-full border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={0}>Choose a template...</option>
                  {libraries.map(lib => (
                    <option key={lib.id} value={lib.id}>{lib.title} ({lib.positionName})</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Assigning a library will create a new <strong>DRAFT</strong> goal set for the current cycle.</span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEmployeeId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedLibraryId === 0}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalManagement;
