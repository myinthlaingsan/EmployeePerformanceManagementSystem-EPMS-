import React from 'react';
import { useParams } from 'react-router-dom';
import { useGetFeedbackSummaryQuery } from '../../features/feedback360/feedback360Api';
import StarRating from '../../components/shared/StatusBadge'; // Wait, I should use the StarRating component
import StarRatingComponent from '../../components/shared/StarRating';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { 
  Trophy, MessageCircle, Shield, TrendingUp, Star, FileText
} from 'lucide-react';

const FeedbackSummaryView: React.FC = () => {
  const { targetUserId, cycleId } = useParams<{ targetUserId: string; cycleId: string }>();
  const { data: summary, isLoading } = useGetFeedbackSummaryQuery({
    targetUserId: Number(targetUserId),
    cycleId: Number(cycleId),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-black tracking-widest text-xs uppercase">Generating Analytics Report...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-20 text-center">
        <FileText className="w-20 h-20 text-slate-200 mx-auto mb-6" />
        <h3 className="text-2xl font-black text-slate-900">Summary Not Found</h3>
        <p className="text-slate-500 mt-2">The feedback summary for this cycle has not been generated or finalized yet.</p>
      </div>
    );
  }

  const radarData = summary.scores.map(score => {
    const selfScore = summary.selfScores.find(s => s.categoryName === score.categoryName);
    return {
      category: score.categoryName,
      Others: score.averageScore,
      Self: selfScore ? selfScore.averageScore : 0
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Header Card */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-8">
          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-200 border-4 border-white">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-[0.2em]">
                {summary.cycleName}
              </span>
              {summary.isFinalized && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Finalized
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{summary.targetUserName}</h1>
            <p className="text-slate-500 font-medium mt-1">360° Professional Performance Summary</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[200px] shadow-2xl shadow-slate-200">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Average</span>
          <div className="text-5xl font-black">{summary.totalAverageScore.toFixed(1)}</div>
          <div className="flex items-center gap-1 mt-2 text-indigo-400">
            <StarRatingComponent rating={Math.round(summary.totalAverageScore / 20)} readonly size={16} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-[500px]">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              Self vs. Others Comparison
            </h3>
            <div className="w-full h-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                  <Radar name="Self" dataKey="Self" stroke="#818CF8" fill="#818CF8" fillOpacity={0.3} />
                  <Radar name="Others" dataKey="Others" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.6} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-[400px]">
            <h3 className="text-xl font-black text-slate-900 mb-8">Detailed Competency Breakdown</h3>
            <div className="w-full h-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.scores} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="categoryName" type="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 800 }} width={150} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="averageScore" radius={[0, 10, 10, 0]} barSize={32}>
                    {summary.scores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.averageScore >= 80 ? '#10B981' : entry.averageScore >= 60 ? '#4F46E5' : '#F59E0B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm max-h-[930px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 sticky top-0 bg-white py-2 z-10">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
              Qualitative Insights
            </h3>
            
            <div className="space-y-6">
              {summary.detailedComments.map((comment, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-indigo-50/30 hover:border-indigo-100 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{comment.categoryName}</span>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <StarRatingComponent rating={comment.score} readonly size={12} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                    "{comment.comment}"
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-black text-indigo-600 border border-indigo-100">
                      {comment.evaluatorRole.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{comment.evaluatorName}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{comment.evaluatorRole}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSummaryView;
