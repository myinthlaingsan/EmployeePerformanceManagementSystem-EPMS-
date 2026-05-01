import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetEmployeeAssessmentQuery } from '../../features/appraisal/appraisalApi';
import ScoreBadge from '../../components/appraisal/ScoreBadge';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: appraisal, isLoading } = useGetEmployeeAssessmentQuery(id || '', { skip: !id });

  const calculateAverage = (responses: any) => {
    if (!responses) return 0;
    const values = Object.values(responses).map((r: any) => r.rating || 0);
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return (sum / values.length).toFixed(1);
  };

  const selfAvg = useMemo(() => calculateAverage(appraisal?.selfAssessment?.responses), [appraisal]);
  const managerAvg = useMemo(() => calculateAverage(appraisal?.managerEvaluation?.responses), [appraisal]);

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold">Loading Results...</div>;
  if (!appraisal) return <div className="p-8 text-center text-slate-500 font-bold">Appraisal results not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-slate-900">Final Results</h1>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">
          COMPLETED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center">
          <ScoreBadge score={selfAvg} label="Self-Assessment Avg" size="lg" theme="indigo" />
          <div className="mt-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`w-2 h-2 rounded-full ${s <= Number(selfAvg) ? 'bg-indigo-400' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center">
          <ScoreBadge score={managerAvg} label="Manager Evaluation Avg" size="lg" theme="emerald" />
          <div className="mt-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`w-2 h-2 rounded-full ${s <= Number(managerAvg) ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-10 text-white mb-8">
        <h2 className="text-xl font-bold mb-6">Performance Insights</h2>
        <div className="space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="text-slate-400">Total Score</span>
            <span className="text-2xl font-bold">{appraisal.finalScore || managerAvg}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <span className="text-slate-400">Alignment</span>
            <span className={`font-bold ${Math.abs(Number(selfAvg) - Number(managerAvg)) < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {Math.abs(Number(selfAvg) - Number(managerAvg)) < 1 ? 'High Alignment' : 'Gap Identified'}
            </span>
          </div>
          <div>
            <p className="text-slate-400 mb-2">Manager's Final Remarks</p>
            <p className="text-slate-300 italic">
              "{appraisal.managerEvaluation.overallComments || 'Professional performance throughout the cycle.'}"
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/appraisal')}
          className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all"
        >
          Back to List
        </button>
        <button className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
          Print Full Report
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
