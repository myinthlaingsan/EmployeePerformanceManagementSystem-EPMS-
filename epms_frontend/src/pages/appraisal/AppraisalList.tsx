import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAppraisalsQuery } from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

const AppraisalList: React.FC = () => {
  const navigate = useNavigate();
  const { data: appraisals = [], isLoading, error } = useGetAppraisalsQuery();
  const user = useSelector((state: any) => state.auth.user);
  const isPrivileged = user?.roles?.some((r: string) => r === 'ROLE_ADMIN' || r === 'ROLE_HR' || r === 'ADMIN' || r === 'HR');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'SELF_ASSESSED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'MANAGER_EVALUATED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'HR_APPROVED': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-100">
        Operation failed. Please try again.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appraisal Workflow</h1>
          <p className="text-slate-500 mt-2">Manage and track your performance reviews.</p>
        </div>
        {isPrivileged && (
          <button 
            onClick={() => navigate('/appraisal/create-cycle')}
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Start New Cycle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appraisals.length > 0 ? appraisals.map((appraisal) => (
          <div 
            key={appraisal.appraisalId}
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/appraisal/${appraisal.appraisalId}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appraisal.status)}`}>
                {appraisal.status.replace('_', ' ')}
              </div>
              <span className="text-xs text-slate-400">
                Assigned {appraisal.assignedAt ? format(new Date(appraisal.assignedAt), 'MMM dd, yyyy') : 'N/A'}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">{appraisal.cycleName}</h3>
            <p className="text-slate-500 text-sm mb-6">Employee: {appraisal.employeeName}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">JD</div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-600">AM</div>
              </div>
              <button className="text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-200">
                View Details →
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No appraisals assigned yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppraisalList;
