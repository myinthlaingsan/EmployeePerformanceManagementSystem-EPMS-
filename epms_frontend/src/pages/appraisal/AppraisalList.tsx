import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appraisalApi } from '../../api/appraisalApi';
import type { Appraisal } from '../../types/appraisal';
import { format } from 'date-fns';

const AppraisalList: React.FC = () => {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppraisals = async () => {
      try {
        const data = await appraisalApi.getAppraisals();
        setAppraisals(data);
      } catch (error) {
        console.error('Failed to fetch appraisals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppraisals();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING_ASSESSMENT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PENDING_EVALUATION': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ASSIGNED': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Appraisal Workflow</h1>
        <p className="text-slate-500 mt-2">Manage and track your performance reviews.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appraisals.length > 0 ? appraisals.map((appraisal) => (
          <div 
            key={appraisal.id}
            className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/appraisal/${appraisal.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(appraisal.status)}`}>
                {appraisal.status.replace('_', ' ')}
              </div>
              <span className="text-xs text-slate-400">
                Updated {format(new Date(appraisal.updatedAt), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-1">Performance Review 2024</h3>
            <p className="text-slate-500 text-sm mb-6">Annual Cycle - Q1 & Q2</p>
            
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
