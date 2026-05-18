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
  const [activeRole, setActiveRole] = React.useState<string>('ALL');

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
          {/* Question-Level Breakdown */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3 sticky top-0 bg-white py-2 z-10">
              <Star className="w-6 h-6 text-indigo-600" />
              Detailed Ratings per Question
            </h3>
            <div className="space-y-4">
              {summary.questionRatings?.map((q, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-[13px] font-black text-slate-700 leading-tight">{q.questionText}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{q.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{q.averageScore.toFixed(0)}%</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{q.responseCount} Responses</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StarRatingComponent rating={Math.round(q.averageScore / 20)} readonly size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm max-h-[800px] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 bg-white py-2 z-10">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
                Qualitative Insights
              </h3>
              
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                {['ALL', 'MANAGER', 'PEER', 'SUBORDINATE'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeRole === role 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-10">
              {/* Executive Summary (Overall Comments) */}
              {summary.detailedComments.filter(c => c.categoryName === 'Overall Summary').length > 0 && (
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Executive Summary
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {summary.detailedComments
                      .filter(c => c.categoryName === 'Overall Summary' && (activeRole === 'ALL' || c.evaluatorRole === activeRole))
                      .map((comment, idx) => (
                        <div key={idx} className="relative pl-8">
                          <div className="absolute left-0 top-0 w-1 h-full bg-indigo-200 rounded-full" />
                          <p className="text-base text-slate-800 font-bold leading-relaxed italic mb-4">
                            "{comment.comment}"
                          </p>
                          <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              comment.evaluatorRole === 'MANAGER' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                              comment.evaluatorRole === 'PEER' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                              'text-emerald-600 bg-emerald-50 border-emerald-100'
                            }`}>
                              {comment.evaluatorRole}
                            </span>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight">— {comment.evaluatorName}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Group by Category (excluding Overall Summary) */}
              {Array.from(new Set(summary.detailedComments.filter(c => c.categoryName !== 'Overall Summary').map(c => c.categoryName))).map(cat => {
                const catComments = summary.detailedComments.filter(c => 
                  c.categoryName === cat && (activeRole === 'ALL' || c.evaluatorRole === activeRole)
                );
                
                if (catComments.length === 0) return null;

                return (
                  <div key={cat} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{cat}</h4>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {catComments.map((comment, idx) => (
                        <div key={idx} className="p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50 transition-all group relative">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-1.5">
                              <StarRatingComponent rating={comment.score} readonly size={10} />
                            </div>
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                              comment.evaluatorRole === 'MANAGER' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                              comment.evaluatorRole === 'PEER' ? 'text-indigo-600 bg-indigo-50 border-indigo-100' :
                              'text-emerald-600 bg-emerald-50 border-emerald-100'
                            }`}>
                              {comment.evaluatorRole}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 font-medium leading-relaxed italic pr-4">
                            "{comment.comment}"
                          </p>
                          <div className="mt-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-indigo-600 border border-indigo-50 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {comment.evaluatorName.charAt(0)}
                            </div>
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{comment.evaluatorName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSummaryView;
