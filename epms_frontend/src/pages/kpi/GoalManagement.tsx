import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useGetEmployeesQuery 
} from '../../features/employee/employeeapi';
import { 
  useGetAllLibrariesQuery, 
  useAssignKpiToEmployeeMutation,
  useApproveGoalSetMutation,
  useCalculateScoreMutation
} from '../../features/kpi/kpiApi';

const GoalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees = [], isLoading: loadingEmployees } = useGetEmployeesQuery();
  const { data: librariesResponse } = useGetAllLibrariesQuery();
  const libraries = librariesResponse?.data || [];

  const [assignKpi] = useAssignKpiToEmployeeMutation();
  const [approveGoal] = useApproveGoalSetMutation();
  const [calculateScore] = useCalculateScoreMutation();

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goal Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{emp.staffName}</div>
                  <div className="text-sm text-gray-500">{emp.employeeCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {emp.positionName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedEmployeeId(emp.id);
                      setShowAssignModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Assign KPI
                  </button>
                  <button
                    onClick={() => navigate(`/kpi/goals/${emp.id}`)}
                    className="text-gray-600 hover:text-gray-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Assign KPI Library</h3>
              <p className="text-sm text-gray-500 mt-1">Select a template to assign to the employee.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select KPI Template</label>
                <select
                  value={selectedLibraryId}
                  onChange={(e) => setSelectedLibraryId(parseInt(e.target.value))}
                  className="w-full border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                >
                  <option value={0}>Choose a template...</option>
                  {libraries.map(lib => (
                    <option key={lib.id} value={lib.id}>{lib.title} ({lib.positionName})</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Assigning a library will create a new DRAFT goal set for the employee for the current cycle.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEmployeeId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={selectedLibraryId === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
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
