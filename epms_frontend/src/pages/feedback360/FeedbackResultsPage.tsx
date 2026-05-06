import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetFeedbackSummaryQuery } from '../../features/feedback360/feedback360Api';
import { useGetActiveCycleQuery } from '../../features/appraisal/appraisalApi';
import { useAuth } from '../../hooks/useAuth';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  ArrowLeft, 
  Download, 
  MessageCircle, 
  TrendingUp,
  Users,
  Award,
  Target,
  AlertCircle
} from 'lucide-react';

const FeedbackResultsPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: activeCycle } = useGetActiveCycleQuery();
  
  const employeeId = subjectId ? parseInt(subjectId, 10) : user?.id;
  const cycleId = activeCycle?.id ? parseInt(activeCycle.id, 10) : null;

  const { data: summary, isLoading, error } = useGetFeedbackSummaryQuery(
    { employeeId: employeeId as number, cycleId: cycleId as number },
    { skip: !employeeId || !cycleId }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
        <p className="text-text-muted font-medium animate-pulse">Aggregating feedback results...</p>
      </div>
    );
  }

  if (!activeCycle && !isLoading) {
    return (
      <div className="p-10 text-center max-w-2xl mx-auto">
        <div className="bg-white p-10 rounded-[3rem] border border-surface-border shadow-premium">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-text-title mb-2">No Active Cycle</h3>
          <p className="text-text-muted font-medium mb-8">An active appraisal cycle is required to view 360° feedback results. Please contact HR to activate the current cycle.</p>
          <button onClick={() => navigate(-1)} className="px-8 py-3 bg-surface-base rounded-2xl border border-surface-border font-bold text-sm">Return Home</button>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-10 text-center max-w-2xl mx-auto">
        <div className="bg-white p-10 rounded-[3rem] border border-surface-border shadow-premium">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-text-title mb-2">No Results Yet</h3>
          <p className="text-text-muted font-medium mb-8">Aggregated 360° feedback reports are generated once a minimum number of responses are collected.</p>
          <button onClick={() => navigate(-1)} className="px-8 py-3 bg-surface-base rounded-2xl border border-surface-border font-bold text-sm">Return Home</button>
        </div>
      </div>
    );
  }

  const radarData = summary.categoryScores.map(cat => ({
    subject: cat.categoryName,
    A: cat.score,
    fullMark: 5
  }));

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-brand-primary font-bold text-xs uppercase tracking-widest transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mb-2">Performance Analytics</p>
          <h1 className="text-4xl font-bold text-text-title tracking-tight">360° Feedback Summary</h1>
          <p className="text-text-muted mt-2 font-medium">Aggregated insights from peers, subordinates, and managers.</p>
        </div>
        
        <button className="bg-white px-6 py-3 rounded-2xl border border-surface-border shadow-premium flex items-center gap-2 text-sm font-bold text-text-title hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Average Score</p>
            <p className="text-3xl font-black text-text-title">{summary.averageScore.toFixed(1)} / 5.0</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-surface-border shadow-premium flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Respondents</p>
            <p className="text-3xl font-black text-text-title">{summary.totalEvaluations}</p>
          </div>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-[2.5rem] text-white shadow-xl flex items-center gap-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center relative z-10">
            <Target className="w-8 h-8 text-brand-secondary" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Insight Status</p>
            <p className="text-xl font-bold">High Confidence</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Competency Radar */}
        <section className="bg-white p-10 rounded-[3rem] border border-surface-border shadow-premium">
          <h2 className="text-2xl font-bold text-text-title mb-8 tracking-tight">Competency Profile</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  strokeWidth={3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="bg-white p-10 rounded-[3rem] border border-surface-border shadow-premium">
           <h2 className="text-2xl font-bold text-text-title mb-8 tracking-tight">Category Breakdown</h2>
           <div className="space-y-6">
              {summary.categoryScores.map(cat => (
                <div key={cat.categoryName} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-text-title">{cat.categoryName}</span>
                      <span className="text-xs font-black text-brand-primary">{cat.score.toFixed(1)}</span>
                   </div>
                   <div className="h-2 w-full bg-surface-base rounded-full overflow-hidden border border-surface-border">
                      <div 
                        className="h-full bg-brand-primary transition-all duration-1000"
                        style={{ width: `${(cat.score / 5) * 100}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* Qualitative Feedback (Comments) */}
      <section className="bg-white p-10 rounded-[3rem] border border-surface-border shadow-premium">
        <div className="flex items-center gap-3 mb-10">
           <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <MessageCircle className="w-6 h-6" />
           </div>
           <h2 className="text-2xl font-bold text-text-title tracking-tight">Qualitative Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Example comments (in real implementation, these would come from the API) */}
          {[
            "Demonstrates exceptional technical leadership and always supports peers during complex sprints.",
            "Communication during cross-departmental projects could be more proactive.",
            "Strong analytical skills, but sometimes focuses too much on details at the expense of deadlines.",
            "An inspiring mentor who consistently helps junior developers grow."
          ].map((comment, i) => (
            <div key={i} className="p-6 bg-surface-base rounded-3xl border border-surface-border italic text-text-muted text-sm relative">
               <span className="absolute -top-2 -left-2 w-8 h-8 bg-white border border-surface-border rounded-full flex items-center justify-center text-brand-primary font-serif text-xl shadow-sm">"</span>
               {comment}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FeedbackResultsPage;
