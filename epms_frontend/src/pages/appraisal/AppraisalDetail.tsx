import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appraisalApi } from '../../api/appraisalApi';
import type { Appraisal } from '../../types/appraisal';
import { format } from 'date-fns';

const AppraisalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const data = await appraisalApi.getAppraisalById(id);
        setAppraisal(data);
      } catch (error) {
        console.error('Failed to fetch appraisal detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!appraisal) return <div className="p-8 text-center">Appraisal not found.</div>;

  const steps = [
    { name: 'Self-Assessment', status: appraisal.selfAssessment.isSubmitted ? 'completed' : 'current' },
    { name: 'Manager Evaluation', status: appraisal.managerEvaluation.isSubmitted ? 'completed' : (appraisal.selfAssessment.isSubmitted ? 'current' : 'upcoming') },
    { name: 'Sign-Off', status: appraisal.status === 'COMPLETED' ? 'completed' : (appraisal.managerEvaluation.isSubmitted ? 'current' : 'upcoming') },
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
                <p className="text-slate-500 mb-1">Employee ID</p>
                <p className="font-bold text-slate-800">{appraisal.employeeId}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Cycle</p>
                <p className="font-bold text-slate-800">{appraisal.cycleId}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Assigned Date</p>
                <p className="font-bold text-slate-800">{format(new Date(appraisal.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-slate-500 mb-1">Last Updated</p>
                <p className="font-bold text-slate-800">{format(new Date(appraisal.updatedAt), 'MMM dd, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {appraisal.status === 'PENDING_ASSESSMENT' && (
                <button 
                  onClick={() => navigate(`/appraisal/${id}/self-assessment`)}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Start Assessment
                </button>
              )}
              {appraisal.status === 'PENDING_EVALUATION' && (
                <button 
                  onClick={() => navigate(`/appraisal/${id}/manager-evaluation`)}
                  className="w-full py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  Start Evaluation
                </button>
              )}
              {appraisal.status === 'COMPLETED' && (
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
