import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetGoalSetByEmployeeQuery,
  useApproveGoalSetMutation,
  useCalculateScoreMutation
} from '../../services/kpiApi';
import { useAuth } from '../../hooks/useAuth';
import ProgressUpdateModal from './components/ProgressUpdateModal';
import KpiRevisionModal from './components/KpiRevisionModal';
import type { GoalItemResponse } from '../../features/kpi/kpiTypes';

const GoalDetail: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: goalSetResponse, isLoading, error } = useGetGoalSetByEmployeeQuery({
    employeeId: parseInt(employeeId!),
    cycleId: 1
  });

  const [approveGoal] = useApproveGoalSetMutation();
  const [calculateScore] = useCalculateScoreMutation();

  const goalSet = goalSetResponse?.data;
  const items = goalSet?.items || [];

  const [selectedItem, setSelectedItem] = useState<GoalItemResponse | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  const isOwner = user?.id === parseInt(employeeId!);
  const isManager = user?.roles.includes('MANAGER') || user?.roles.includes('ADMIN');

  const handleApprove = async () => {
    if (!goalSet) return;
    try {
      await approveGoal(goalSet.id).unwrap();
      alert('Goal set approved!');
    } catch (err) {
      alert('Failed to approve goal set');
    }
  };

  const handleCalculate = async () => {
    if (!goalSet) return;
    try {
      await calculateScore({ employeeId: goalSet.employeeId, cycleId: goalSet.appraisalCycleId }).unwrap();
      alert('Score calculated successfully!');
    } catch (err) {
      alert('Failed to calculate score');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading goal details...</div>;
  if (error || !goalSet) return <div className="p-8 text-center text-red-500">Goal set not found for this cycle.</div>;

  const totalWeight = items.reduce((sum, i) => sum + i.weightPercent, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-gray-400 hover:text-blue-600 mb-2 flex items-center gap-1 uppercase tracking-wider"
          >
            ← Back to List
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{goalSet.employeeName}'s Performance Goals</h1>
          <p className="text-sm text-gray-500">Cycle: {goalSet.appraisalCycleId} | Manager: {goalSet.managerName}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${goalSet.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
            {goalSet.status}
          </span>

          {isManager && goalSet.status === 'DRAFT' && (
            <button
              onClick={handleApprove}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold text-sm shadow-sm transition"
            >
              Approve Goals
            </button>
          )}

          {isManager && goalSet.status === 'APPROVED' && (
            <button
              onClick={handleCalculate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm transition"
            >
              Calculate Score
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Weight</p>
          <p className={`text-2xl font-bold ${totalWeight === 100 ? 'text-blue-600' : 'text-red-600'}`}>
            {totalWeight}% <span className="text-sm text-gray-300">/ 100%</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">KPI Count</p>
          <p className="text-2xl font-bold text-gray-900">{items.length} Goals</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Execution Status</p>
          <p className="text-2xl font-bold text-gray-900">
            {goalSet.status === 'APPROVED' ? 'Active' : 'Pending'}
          </p>
        </div>
      </div>

      {/* Goal Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">KPI Item</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">{item.title}</div>
                    <div className="text-[10px] text-gray-500 font-semibold uppercase">{item.categoryName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {item.weightPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {item.targetValue} <span className="text-[10px] uppercase text-gray-300">{item.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-500"
                          style={{ width: `${Math.min(((item.currentProgress || 0) / item.targetValue) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-700">
                        {Math.round(((item.currentProgress || 0) / item.targetValue) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {isOwner && goalSet.status === 'APPROVED' && (
                        <button
                          onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
                          className="text-[10px] bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition border border-blue-100"
                        >
                          UPDATE
                        </button>
                      )}
                      {isManager && (
                        <button
                          onClick={() => { setSelectedItem(item); setShowRevisionModal(true); }}
                          className="text-[10px] bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-100 transition border border-gray-200"
                        >
                          REVISE
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProgressModal && selectedItem && (
        <ProgressUpdateModal
          item={selectedItem}
          onClose={() => { setShowProgressModal(false); setSelectedItem(null); }}
        />
      )}
      {showRevisionModal && selectedItem && (
        <KpiRevisionModal
          item={selectedItem}
          onClose={() => { setShowRevisionModal(false); setSelectedItem(null); }}
        />
      )}
    </div>
  );
};

export default GoalDetail;
