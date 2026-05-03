import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPipsQuery, useGetPipsByInvolvedUserQuery } from '../../services/pipApi';
import { useAuth } from '../../hooks/useAuth';

const PipListPage: React.FC = () => {
    const navigate = useNavigate();
    const { isHR, isAdmin, user } = useAuth();
    
    // Filters State
    const [deptFilter, setDeptFilter] = useState('Engineering');
    const [statusFilter, setStatusFilter] = useState('All Active');

    // Correct Hook usage with skip logic
    const { data: allPipsResponse, isLoading: isLoadingAll } = useGetPipsQuery(undefined, { 
        skip: !isHR && !isAdmin 
    });
    
    const { data: involvedPipsResponse, isLoading: isLoadingInvolved } = useGetPipsByInvolvedUserQuery(user?.id || 0, { 
        skip: isHR || isAdmin || !user?.id 
    });

    const pipsResponse = (isHR || isAdmin) ? allPipsResponse : involvedPipsResponse;
    const isLoading = (isHR || isAdmin) ? isLoadingAll : isLoadingInvolved;
    const pips = pipsResponse?.data || [];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 bg-surface-base">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    const metrics = [
        { 
            label: 'ACTIVE PLANS', 
            value: pips.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length, 
            color: 'border-blue-500', 
            bgColor: 'bg-blue-50/50',
            icon: (
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            )
        },
        { 
            label: 'SUCCESSFUL', 
            value: pips.filter(p => p.status === 'COMPLETED').length, 
            color: 'border-emerald-500', 
            bgColor: 'bg-emerald-50/50',
            icon: (
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        { 
            label: 'UNSUCCESSFUL', 
            value: pips.filter(p => p.status === 'CLOSED').length, 
            color: 'border-red-500', 
            bgColor: 'bg-red-50/50',
            icon: (
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
            )
        },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'IN_PROGRESS': return 'bg-blue-100/50 text-blue-600 border-blue-200';
            case 'DRAFT': return 'bg-slate-100/50 text-slate-600 border-slate-200';
            case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-600 border-emerald-200';
            default: return 'bg-surface-base text-text-muted border-surface-border';
        }
    };

    return (
        <div className="space-y-12">
            {/* Phase 2: Analytical Header Section */}
            <div className="flex flex-col gap-10">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-[#0f172a] tracking-tight mb-2">PIPs Overview</h1>
                        <p className="text-text-muted font-medium max-w-md">
                            Managing growth and accountability across your department.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {metrics.map((m) => (
                            <div key={m.label} className={`bg-white border-l-4 ${m.color} rounded-2xl p-6 shadow-premium w-56 flex items-center justify-between`}>
                                <div>
                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{m.label}</p>
                                    <p className="text-4xl font-black text-[#0f172a]">{m.value.toString().padStart(2, '0')}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-2xl ${m.bgColor} flex items-center justify-center`}>
                                    {m.icon}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter Bar & Action */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-white border border-surface-border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Department:</span>
                            <select 
                                value={deptFilter} 
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="text-sm font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                            >
                                <option>Engineering</option>
                                <option>Marketing</option>
                                <option>Sales</option>
                            </select>
                        </div>

                        <div className="bg-white border border-surface-border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Status:</span>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-sm font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                            >
                                <option>All Active</option>
                                <option>Drafts Only</option>
                                <option>Completed</option>
                            </select>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/pip/new')}
                        className="bg-[#0f172a] text-white px-8 py-3.5 rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition flex items-center gap-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Launch New PIP
                    </button>
                </div>
            </div>

            {/* Phase 3: High-Density Ledger Table */}
            <div className="bg-white rounded-[2.5rem] border border-surface-border shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] border-b border-surface-border">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Employee</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Progress</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Severity</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Start Date</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Next Review</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pips.length > 0 ? pips.map((pip) => (
                                <tr key={pip.pipId} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border border-slate-200/50">
                                                <img 
                                                    src={`https://ui-avatars.com/api/?name=${pip.employeeId}&background=random&color=fff`} 
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0f172a] text-base tracking-tight mb-0.5">Reference #{pip.pipId}</p>
                                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Employee ID: {pip.employeeId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="w-56">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Day 12 of 30</span>
                                                <span className="text-[10px] font-bold text-[#0f172a]">40%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] border ${getStatusStyle(pip.status)}`}>
                                            {pip.status === 'ACTIVE' ? 'ON TRACK' : pip.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        {pip.severity ? (
                                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                pip.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                                                pip.severity === 'URGENT' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                                {pip.severity}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-text-muted italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-bold text-text-title tracking-tight">{new Date(pip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="text-sm font-bold text-[#0f172a] tracking-tight">{new Date(pip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <button 
                                            onClick={() => navigate(`/pip/${pip.pipId}`)}
                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-all shadow-sm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-10 py-24 text-center">
                                        <p className="text-text-muted font-bold text-lg tracking-tight">No active plans in this ledger.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-[#f8fafc] border-t border-surface-border px-10 py-4 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Showing {pips.length} of {pips.length} active plans</p>
                    <div className="flex items-center gap-4">
                        <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition shadow-sm cursor-not-allowed opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-white transition shadow-sm cursor-not-allowed opacity-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Phase 4: Insights Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Success Rate Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-surface-border shadow-premium p-10">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Quarterly Success Rate</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-bold text-text-muted uppercase">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                <span className="text-[10px] font-bold text-text-muted uppercase">Completed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between h-48 gap-8 px-4">
                        {[
                            { month: 'Jan', val: 65 },
                            { month: 'Feb', val: 45 },
                            { month: 'Mar', val: 85 },
                            { month: 'Apr', val: 55 },
                            { month: 'May', val: 95 },
                            { month: 'Jun', val: 75 },
                        ].map((d) => (
                            <div key={d.month} className="flex-1 flex flex-col items-center gap-4 group">
                                <div className="w-full relative bg-slate-50 rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                                    <div 
                                        className="w-full bg-blue-500 rounded-t-xl group-hover:bg-blue-600 transition-all duration-700" 
                                        style={{ height: `${d.val}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{d.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Insights Card */}
                <div className="bg-blue-50/50 rounded-[2.5rem] border border-blue-100 p-10 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-black text-blue-900 tracking-tight mb-4">Performance Insights</h3>
                        <p className="text-sm text-blue-700 font-medium leading-relaxed mb-8">
                            Average completion time for successful PIPs has decreased by <span className="font-black">12%</span> this quarter. 
                        </p>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-blue-100 shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Growth Trend</p>
                                    <p className="text-xs text-blue-700 font-bold">+18% Employee Retained</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition uppercase tracking-widest mt-10">
                        View Detailed Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PipListPage;
