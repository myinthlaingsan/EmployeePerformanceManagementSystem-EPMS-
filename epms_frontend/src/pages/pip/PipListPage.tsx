import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPipsQuery, useGetPipsByInvolvedUserQuery } from '../../services/pipApi';
import { useAuth } from '../../hooks/useAuth';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { format, parseISO, differenceInDays, isBefore, isAfter, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    Plus,
    Calendar,
    ChevronRight,
    Users,
    Activity,
    Target,
    User
} from 'lucide-react';

const PipListPage: React.FC = () => {
    const navigate = useNavigate();
    const { isHR, isAdmin, isManager, user } = useAuth();

    // Filters State
    const { data: employees } = useGetEmployeesQuery();

    // Filters State
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [severityFilter, setSeverityFilter] = useState('All Severities');

    // Correct Hook usage with skip logic
    const { data: allPipsResponse, isLoading: isLoadingAll } = useGetPipsQuery(undefined, {
        skip: !isHR && !isAdmin
    });

    const { data: involvedPipsResponse, isLoading: isLoadingInvolved } = useGetPipsByInvolvedUserQuery(user?.id || 0, {
        skip: isHR || isAdmin || !user?.id
    });

    const pipsResponse = (isHR || isAdmin) ? allPipsResponse : involvedPipsResponse;
    const isLoading = (isHR || isAdmin) ? isLoadingAll : isLoadingInvolved;
    const allPips = pipsResponse?.data || [];

    // Helper to get employee data
    const getEmployee = (id: number) => employees?.find(e => e.id === id);

    // Dynamic Filter Options: Only show departments that actually have PIPs
    const departmentsWithPips = allPips.map(pip => getEmployee(pip.employeeId)?.currentDepartmentName).filter(Boolean) as string[];
    const departments = ['All Departments', ...new Set(departmentsWithPips)];

    // Apply Filters
    const pips = allPips.filter(pip => {
        const employee = getEmployee(pip.employeeId);
        const matchesDept = deptFilter === 'All Departments' || employee?.currentDepartmentName === deptFilter;

        let matchesStatus = true;
        if (statusFilter !== 'All Status') {
            if (statusFilter === 'Draft') matchesStatus = pip.status === 'DRAFT';
            else if (statusFilter === 'All Active') matchesStatus = ['ACTIVE', 'IN_PROGRESS', 'EXTENDED'].includes(pip.status);
            else if (statusFilter === 'Extended') matchesStatus = pip.status === 'EXTENDED';
            else if (statusFilter === 'Closed') matchesStatus = pip.status === 'CLOSED';
            else if (statusFilter === 'Completed') matchesStatus = pip.status === 'COMPLETED';
        }

        const matchesSeverity = severityFilter === 'All Severities' || pip.severity === severityFilter.toUpperCase();

        return matchesDept && matchesStatus && matchesSeverity;
    });

    // Insights Calculations
    const completedCount = allPips.filter(p => p.status === 'COMPLETED').length;
    const closedCount = allPips.filter(p => p.status === 'CLOSED').length;
    const totalFinished = completedCount + closedCount;
    const successRate = totalFinished > 0 ? Math.round((completedCount / totalFinished) * 100) : 0;

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
            value: allPips.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'EXTENDED').length,
            color: 'border-blue-500',
            bgColor: 'bg-blue-50/50',
            icon: <Activity className="w-6 h-6 text-blue-500" />
        },
        {
            label: 'SUCCESSFUL',
            value: allPips.filter(p => p.status === 'COMPLETED').length,
            color: 'border-emerald-500',
            bgColor: 'bg-emerald-50/50',
            icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        },
        {
            label: 'UNSUCCESSFUL',
            value: allPips.filter(p => p.status === 'CLOSED').length,
            color: 'border-red-500',
            bgColor: 'bg-red-50/50',
            icon: <AlertCircle className="w-6 h-6 text-red-500" />
        },
    ];

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'IN_PROGRESS': return 'bg-blue-100/50 text-blue-600 border-blue-200';
            case 'EXTENDED': return 'bg-orange-100/50 text-orange-600 border-orange-200';
            case 'DRAFT': return 'bg-slate-100/50 text-slate-600 border-slate-200';
            case 'COMPLETED': return 'bg-emerald-100/50 text-emerald-600 border-emerald-200';
            case 'CLOSED': return 'bg-red-100/50 text-red-600 border-red-200';
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
                        {(isHR || isAdmin || isManager) && (
                            <div className="bg-white border border-surface-border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Department:</span>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    className="text-sm font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="bg-white border border-surface-border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-sm font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                            >
                                <option>All Status</option>
                                <option>Draft</option>
                                <option>All Active</option>
                                <option>Extended</option>
                                <option>Closed</option>
                            </select>
                        </div>
                        
                        {/* Severity Filter */}
                        <div className="bg-white border border-surface-border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Severity:</span>
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="text-sm font-bold text-[#0f172a] bg-transparent outline-none cursor-pointer"
                            >
                                <option>All Severities</option>
                                <option>Standard</option>
                                <option>Urgent</option>
                                <option>Critical</option>
                            </select>
                        </div>
                    </div>

                    {isHR && (
                        <button
                            onClick={() => navigate('/pip/new')}
                            className="bg-[#0f172a] text-white px-8 py-3.5 rounded-2xl text-xs font-bold shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition flex items-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            Launch New PIP
                        </button>
                    )}
                </div>
            </div>

            {/* Phase 3: High-Density Ledger Table */}
            <div className="bg-white rounded-[2.5rem] border border-surface-border shadow-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc] border-b border-surface-border">
                            <tr>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Employee</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Manager</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Progress</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Status</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Severity</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Start Date</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Next Review</th>
                                <th className="px-10 py-6 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pips.length > 0 ? pips.map((pip) => {
                                const employee = getEmployee(pip.employeeId);
                                const start = parseISO(pip.startDate);
                                const today = new Date();

                                // Get next review if exists
                                const nextReview = pip.scheduledReviewDates?.find(d => isAfter(parseISO(d), today));

                                return (
                                    <tr key={pip.pipId} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-inner border border-slate-200/50">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.staffName || 'U')}&background=005db5&color=fff`}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-[14px] font-black text-[#0f172a] tracking-tight">{employee?.staffName || 'Unknown'}</p>
                                                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{employee?.currentDepartmentName || 'No Dept'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                                </div>
                                                <p className="text-[13px] font-bold text-[#0f172a]">{getEmployee(pip.managerId)?.staffName || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="w-56">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Performance Score</span>
                                                    <span className="text-[10px] font-bold text-[#0f172a]">{pip.overallProgress || 0}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${pip.overallProgress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] border ${getStatusStyle(pip.status)} w-fit`}>
                                                    {pip.status}
                                                </span>
                                                {((pip.status === 'ACTIVE' || pip.status === 'EXTENDED') && parseISO(pip.endDate) < new Date()) && (
                                                    <span className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest animate-pulse w-fit">
                                                        Awaiting Determination
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {pip.severity ? (
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${pip.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
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
                                            <p className="text-sm font-bold text-text-title tracking-tight">{format(start, 'MMM dd, yyyy')}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-bold text-[#0f172a] tracking-tight">
                                                {nextReview ? format(parseISO(nextReview), 'MMM dd, yyyy') : 'No upcoming review'}
                                            </p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => navigate(`/pip/${pip.pipId}`)}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-[#0f172a] hover:text-white hover:border-[#0f172a] transition-all shadow-sm"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
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
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Showing {pips.length} of {allPips.length} records</p>
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

            {/* Phase 4: Insights Panel - Hidden for regular employees */}
            {(isHR || isAdmin || isManager) && (
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
                            {[5, 4, 3, 2, 1, 0].map((monthsAgo) => {
                                const date = subMonths(new Date(), monthsAgo);
                                const monthLabel = format(date, 'MMM');
                                const monthStart = startOfMonth(date);
                                const monthEnd = endOfMonth(date);

                                const pipsInMonth = allPips.filter(p => {
                                    const pDate = parseISO(p.startDate);
                                    return pDate >= monthStart && pDate <= monthEnd;
                                }).length;

                                // Scale the bar. Assuming max 10 PIPs per month for scaling
                                const height = Math.min(100, (pipsInMonth / 10) * 100);

                                return (
                                    <div key={monthLabel} className="flex-1 flex flex-col items-center gap-4 group">
                                        <div className="w-full relative bg-slate-50 rounded-t-xl overflow-hidden h-full flex flex-col justify-end">
                                            <div
                                                className="w-full bg-blue-500 rounded-t-xl group-hover:bg-blue-600 transition-all duration-700"
                                                style={{ height: `${height || 5}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{monthLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Performance Insights Card */}
                    <div className="bg-blue-50/50 rounded-[2.5rem] border border-blue-100 p-10 flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black text-blue-900 tracking-tight mb-4">Performance Insights</h3>
                            <p className="text-sm text-blue-700 font-medium leading-relaxed mb-8">
                                Based on your current ledger, successful completion rate is sitting at <span className="font-black text-emerald-600">{successRate}%</span>.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl border border-blue-100 shadow-sm">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Success Metrics</p>
                                        <p className="text-xs text-blue-700 font-bold">{completedCount} Employees Retained</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-blue-600 text-white py-4 rounded-2xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition uppercase tracking-widest mt-10">
                            View Detailed Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipListPage;
