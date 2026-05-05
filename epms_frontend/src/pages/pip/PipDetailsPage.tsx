import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    useGetPipByIdQuery, 
    useGetObjectivesByPipQuery, 
    useGetReviewsByPipQuery,
    useActivatePipMutation,
    useFinalizePipMutation
} from '../../services/pipApi';

const PipDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const pipId = Number(id);

    // Fetch Data
    const { data: pipResponse, isLoading: isPipLoading } = useGetPipByIdQuery(pipId);
    const { data: objectivesResponse } = useGetObjectivesByPipQuery(pipId);
    const { data: reviewsResponse } = useGetReviewsByPipQuery(pipId);

    const pip = pipResponse?.data;
    const objectives = objectivesResponse?.data || [];
    const reviews = reviewsResponse?.data || [];

    // Calculated Metrics
    const objectivesMet = objectives.filter(o => o.status === 'COMPLETED').length;
    const totalObjectives = objectives.length;
    const progressPercent = totalObjectives > 0 ? Math.round((objectivesMet / totalObjectives) * 100) : 0;
    
    const startDate = pip ? new Date(pip.startDate) : new Date();
    const timeElapsed = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (isPipLoading || !pip) {
        return (
            <div className="flex justify-center items-center h-screen bg-surface-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header / Breadcrumbs */}
            <header className="space-y-6">
                <nav className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">
                    <span className="cursor-pointer hover:text-brand-primary" onClick={() => navigate('/pip')}>PIPS</span>
                    <span>/</span>
                    <span className="text-text-title">REFERENCE #{pip.pipId}</span>
                </nav>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#0f172a] tracking-tight mb-3">Performance Improvement Plan</h1>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-text-muted">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                Started: {new Date(pip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                Reviewer: {pip.managerId}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                            {pip.status === 'ACTIVE' ? 'ON TRACK' : pip.status}
                        </span>
                        <button className="bg-white text-[#0f172a] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 transition">
                            Export Report
                        </button>
                    </div>
                </div>
            </header>

            {/* Top Metrics Section */}
            <div className="bg-white rounded-[2.5rem] border border-surface-border shadow-premium p-10">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-end">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Overall Progress</h3>
                            <span className="text-4xl font-black text-blue-600">{progressPercent}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-blue-500 rounded-full shadow-lg transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 lg:border-l lg:border-slate-100 lg:pl-12">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Time Elapsed</p>
                            <p className="text-2xl font-black text-[#0f172a]">{timeElapsed} Days</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Objectives Met</p>
                            <p className="text-2xl font-black text-[#0f172a]">{objectivesMet} / {totalObjectives}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Next Check-in</p>
                            <p className="text-2xl font-black text-[#0f172a]">{new Date(pip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                {/* Left Column: Objectives */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Improvement Objectives</h3>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{objectives.length} Total</span>
                    </div>

                    <div className="space-y-6">
                        {objectives.map((obj) => (
                            <div key={obj.objectiveId} className="bg-white rounded-[2rem] border border-surface-border shadow-premium overflow-hidden group">
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-1.5 h-10 rounded-full ${obj.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <h4 className="font-bold text-lg text-[#0f172a] tracking-tight">{obj.title}</h4>
                                                <p className="text-sm text-text-muted mt-1 leading-relaxed">{obj.description}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${
                                            obj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                            {obj.status === 'COMPLETED' ? 'ACHIEVED' : obj.status}
                                        </span>
                                    </div>

                                    {/* Manager Comment Block */}
                                    <div className="mt-6 bg-slate-50/80 rounded-2xl p-6 border border-slate-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Manager Comment</span>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed italic">
                                            {obj.status === 'COMPLETED' 
                                                ? "Outstanding progress. Objective has been met ahead of the target date." 
                                                : "Progress is consistent with expectations. Continue monitoring KPIs for the final phase."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Sidebar */}
                <div className="space-y-10">
                    {/* Milestone Timeline */}
                    <div className="bg-white rounded-[2.5rem] border border-surface-border shadow-premium p-10">
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em] mb-10">Milestone Timeline</h3>
                        <div className="space-y-12 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                            
                            {[
                                { date: pip.startDate, title: 'PIP Initiation', desc: 'Signed off and targets locked.', status: 'completed' },
                                { date: '30-Day Check-in', title: '30-Day Evaluation', desc: 'Performance trajectory assessment.', status: 'active' },
                                { date: pip.endDate, title: 'Final Determination', desc: 'PIP conclusion and outcome session.', status: 'pending' },
                            ].map((milestone, idx) => (
                                <div key={idx} className="relative pl-10">
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center ${
                                        milestone.status === 'completed' ? 'bg-emerald-500' : milestone.status === 'active' ? 'bg-blue-500' : 'bg-slate-200'
                                    }`}>
                                        {milestone.status === 'completed' && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{milestone.date.length > 15 ? new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : milestone.date}</p>
                                    <p className="font-bold text-sm text-[#0f172a] mb-1">{milestone.title}</p>
                                    <p className="text-xs text-text-muted leading-relaxed">{milestone.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manager's Private Notes */}
                    <div className="bg-blue-50/50 rounded-[2.5rem] border border-blue-100 p-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">Manager's Private Notes</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm italic text-xs text-blue-700 leading-relaxed mb-6">
                            "Employee is responding well to feedback but seems anxious about the SQL metrics. Might need additional pair programming."
                        </div>
                        <button className="w-full text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition">
                            + Add Private Note
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Meeting Logs & Reflections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Follow-up Meeting Logs</h3>
                        <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">+ New Entry</button>
                    </div>
                    <div className="space-y-6">
                        {reviews.length > 0 ? reviews.map((rev) => (
                            <div key={rev.reviewId} className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-sm text-[#0f172a]">{rev.nextAction || 'Alignment Meeting'}</p>
                                        <span className="text-[10px] text-text-muted font-bold">{new Date(rev.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <p className="text-xs text-text-muted leading-relaxed">{rev.managerFeedback}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-xs text-text-muted italic">No meeting logs recorded yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Employee Reflection Area</h3>
                    <div className="bg-white rounded-[2.5rem] border border-surface-border shadow-premium p-10 space-y-6">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Self-Assessment Reflection</p>
                        <textarea 
                            className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm outline-none focus:border-blue-200 transition-all resize-none"
                            placeholder="How do you feel you are progressing towards your goals this week?"
                        ></textarea>
                        <div className="flex justify-end">
                            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                                Save Reflection
                            </button>
                        </div>

                        <div className="pt-6 border-t border-slate-50">
                            <p className="text-[9px] font-black text-blue-900 uppercase tracking-widest mb-3">Previous Entry (Nov 01)</p>
                            <p className="text-xs text-slate-500 leading-relaxed italic">
                                "I'm feeling much more confident with the reporting cycle now. The new SQL templates are helping me save at least 2 hours a week."
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipDetailsPage;
