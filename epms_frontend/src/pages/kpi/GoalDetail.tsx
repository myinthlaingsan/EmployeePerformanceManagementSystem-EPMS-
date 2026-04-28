import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  useGetGoalSetByEmployeeQuery, 
  useApproveGoalSetMutation, 
  useCalculateScoreMutation 
} from '../../features/kpi/kpiApi';
import { useAuth } from '../../hooks/useAuth';
import ProgressUpdateModal from './components/ProgressUpdateModal';
import KpiRevisionModal from './components/KpiRevisionModal';
import type { GoalItemResponse } from '../../features/kpi/kpiTypes';

const GoalDetail: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Hardcoded cycleId 1 for now as per previous implementation
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

  if (isLoading) return <div className="p-8 text-center">Loading goal details...</div>;
  if (error || !goalSet) return <div className="p-8 text-center text-red-500">Goal set not found for this cycle.</div>;

  const totalWeight = items.reduce((sum, i) => sum + i.weightPercent, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-blue-600 mb-2 flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{goalSet.employeeName}'s Goals</h1>
          <p className="text-gray-500">Cycle: {goalSet.appraisalCycleId} | Manager: {goalSet.managerName}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
            goalSet.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {goalSet.status}
          </span>
          
          {isManager && goalSet.status === 'DRAFT' && (
            <button 
              onClick={handleApprove}
              className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 font-medium transition shadow-sm"
            >
              Approve Goal Set
            </button>
          )}

          {isManager && goalSet.status === 'APPROVED' && (
             <button 
              onClick={handleCalculate}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-medium transition shadow-sm"
            >
              Calculate Final Score
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Weight</p>
          <p className={`text-2xl font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {totalWeight}% / 100%
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">KPI Items</p>
          <p className="text-2xl font-bold text-gray-900">{items.length} Goals</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 font-medium mb-1">Overall Status</p>
          <p className="text-2xl font-bold text-blue-600">
            {goalSet.status === 'APPROVED' ? 'In Progress' : 'Pending Approval'}
          </p>
        </div>
      </div>

      {/* Goal List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">KPI Description</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Weight</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5">
                  <div className="text-sm font-bold text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.categoryName}</div>
                </td>
                <td className="px-6 py-5 text-sm font-medium text-gray-700">
                  {item.weightPercent}%
                </td>
                <td className="px-6 py-5 text-sm text-gray-600 font-medium">
                  {item.targetValue} {item.unit}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(((item.currentProgress || 0) / item.targetValue) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 whitespace-nowrap">
                      {item.currentProgress || 0} / {item.targetValue}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    {isOwner && goalSet.status === 'APPROVED' && (
                      <button 
                        onClick={() => { setSelectedItem(item); setShowProgressModal(true); }}
                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition"
                      >
                        Update Progress
                      </button>
                    )}
                    {isManager && (
                      <button 
                        onClick={() => { setSelectedItem(item); setShowRevisionModal(true); }}
                        className="text-xs bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition border border-gray-200"
                      >
                        Revise
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
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
