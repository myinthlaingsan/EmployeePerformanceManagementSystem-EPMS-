import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEmployeeAssessmentQuery } from '../../features/appraisal/appraisalApi';
import { format } from 'date-fns';

const AppraisalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: appraisal, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Details...</div>;
  if (!appraisal) return <div className="p-8 text-center text-slate-500 font-bold">Appraisal not found.</div>;

  const steps = [
    { name: 'Self-Assessment', status: appraisal.selfSubmittedAt ? 'completed' : 'current' },
    { name: 'Manager Evaluation', status: appraisal.managerSubmittedAt ? 'completed' : (appraisal.selfSubmittedAt ? 'current' : 'upcoming') },
    { name: 'Sign-Off', status: (appraisal.employeeSignedAt && appraisal.managerSignedAt) ? 'completed' : (appraisal.managerSubmittedAt ? 'current' : 'upcoming') },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          ←
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Appraisal Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Workflow Progress</h2>
            <div className="relative">
              {steps.map((step, idx) => (
                <div key={step.name} className="flex items-start mb-8 last:mb-0">
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.status === 'completed' ? 'bg-indigo-600 border-indigo-600 text-white' : 
                    step.status === 'current' ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-300'
                  }`}>
                    {step.status === 'completed' ? '✓' : idx + 1}
                  </div>
                  {idx !== steps.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-8 -ml-px ${step.status === 'completed' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  )}
                  <div className="ml-4">
                    <p className={`font-bold ${step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-800'}`}>{step.name}</p>
                    <p className="text-sm text-slate-500">
                      {step.status === 'completed' ? 'Finished and verified.' : step.status === 'current' ? 'Action required.' : 'Waiting for previous steps.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Employee Name</p>
                <p className="font-bold text-slate-800">{appraisal.employeeName || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Employee Code</p>
                <p className="font-bold text-slate-800">{appraisal.employeeCode || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Cycle Name</p>
                <p className="font-bold text-slate-800">{appraisal.cycleName || 'N/A'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Assigned At</p>
                <p className="font-bold text-slate-800">{appraisal.assignedAt ? format(new Date(appraisal.assignedAt), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {appraisal.status === 'PENDING' && (
                <button 
                  onClick={() => navigate(`/appraisal/${id}/self-assessment`)}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Start Assessment
                </button>
              )}
              {appraisal.status === 'SELF_ASSESSED' && (
                <button 
                  onClick={() => navigate(`/appraisal/${id}/manager-evaluation`)}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Start Evaluation
                </button>
              )}
              {appraisal.status === 'FINALIZED' && (
                <button 
                  onClick={() => navigate(`/appraisal/${id}/results`)}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  View Results
                </button>
              )}
              <button className="w-full py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors">
                Download PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 text-white">
            <h3 className="text-lg font-bold mb-2">Help & Support</h3>
            <p className="text-slate-400 text-sm mb-4">Need help filling out your appraisal?</p>
            <button className="text-indigo-400 font-bold text-sm hover:underline">Read Guidelines →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppraisalDetail;
