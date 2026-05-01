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
                    onClick={() => navigate(`/kpi/assign/${emp.id}`)}
                    className="px-4 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md text-xs font-bold transition-all uppercase tracking-widest border border-blue-100"
                  >
                    Assign Goals
                  </button>
                  <button
                    onClick={() => navigate(`/kpi/goals/${emp.id}`)}
                    className="ml-3 px-4 py-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-md text-xs font-bold transition-all uppercase tracking-widest border border-gray-100"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default GoalManagement;
