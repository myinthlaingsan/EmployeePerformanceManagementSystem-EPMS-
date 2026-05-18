import React, { useState, useMemo } from 'react';
import { 
  useGetPendingFeedbacksQuery,
  useSendFeedbackReminderMutation,
  useSendAllFeedbackRemindersMutation,
} from '../../../features/feedback360/feedback360Api';
import { useGetCyclesQuery } from '../../../features/appraisal/appraisalApi';
import type { PendingFeedbackDTO } from '../../../features/feedback360/feedback360Types';
import {
  Search,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Clock,
  Loader2,
  Users,
  User,
  RefreshCw,
  Bell,
  Mail,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DaysChip({ days }: { days: number }) {
  if (days < 0)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
        <AlertCircle className="w-3 h-3" />
        Overdue {Math.abs(days)}d
      </span>
    );
  if (days <= 3)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Clock className="w-3 h-3" />
        {days}d left
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <Clock className="w-3 h-3" />
      {days}d left
    </span>
  );
}

function RelationshipBadge({ rel }: { rel: string }) {
  const map: Record<string, string> = {
    SELF: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    MANAGER: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    SUPERIOR: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    PEER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    SUBORDINATE: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[rel] ?? 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
      {rel}
    </span>
  );
}

// ─── Sort helpers ────────────────────────────────────────────────────────────

type SortKey = 'evaluatorName' | 'targetUserName' | 'cycleName' | 'daysRemaining';
type SortDir = 'asc' | 'desc';

// ─── Main Component ──────────────────────────────────────────────────────────

const PendingFeedbackList: React.FC = () => {
  const { data: pendingList = [], isFetching, refetch } = useGetPendingFeedbacksQuery();
  const { data: cycles } = useGetCyclesQuery();
  
  const [sendReminder, { isLoading: isReminding }] = useSendFeedbackReminderMutation();
  const [sendAllReminders, { isLoading: isRemindingAll }] = useSendAllFeedbackRemindersMutation();

  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('daysRemaining');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSendReminder = async (requestId: number) => {
    try {
      await sendReminder(requestId).unwrap();
      alert('Reminder sent successfully!');
    } catch (err) {
      alert('Failed to send reminder: ' + (err as any)?.data?.message || 'Unknown error');
    }
  };

  const handleRemindAll = async () => {
    const selectedCycleId = cycles?.find(c => c.cycleName === cycleFilter)?.cycleId;
    const msg = cycleFilter === 'ALL' 
      ? 'Are you sure you want to send reminders to ALL pending evaluators across ALL cycles?'
      : `Are you sure you want to send reminders to all pending evaluators for cycle "${cycleFilter}"?`;
    
    if (!window.confirm(msg)) return;

    try {
      await sendAllReminders(selectedCycleId).unwrap();
      alert('Reminders sent to all pending evaluators!');
    } catch (err) {
      alert('Failed to send reminders: ' + (err as any)?.data?.message || 'Unknown error');
    }
  };

  // Enrich data with daysRemaining
  const enriched = useMemo(
    () =>
      pendingList.map((item) => ({
        ...item,
        daysRemaining: calcDaysRemaining(item.cycleEndDate),
      })),
    [pendingList]
  );

  // Unique cycles for filter dropdown
  const cycleOptions = useMemo(() => {
    const names = [...new Set(enriched.map((i) => i.cycleName))].sort();
    return names;
  }, [enriched]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter((item) => {
      const matchSearch =
        !q ||
        item.evaluatorName.toLowerCase().includes(q) ||
        item.targetUserName.toLowerCase().includes(q) ||
        item.evaluatorDepartmentName.toLowerCase().includes(q) ||
        item.cycleName.toLowerCase().includes(q);
      const matchCycle = cycleFilter === 'ALL' || item.cycleName === cycleFilter;
      return matchSearch && matchCycle;
    });
  }, [enriched, search, cycleFilter]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'daysRemaining') { av = a.daysRemaining; bv = b.daysRemaining; }
      else { av = (a[sortKey] as string).toLowerCase(); bv = (b[sortKey] as string).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-1 text-indigo-400" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1 text-indigo-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1 opacity-30" />
    );

  // Stats
  const overdue = enriched.filter((i) => i.daysRemaining < 0).length;
  const dueSoon = enriched.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 3).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Feedback List</h2>
          <p className="text-sm text-slate-500 mt-1">
            All unanswered 360° evaluations across every active cycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRemindAll}
            disabled={isRemindingAll || isFetching || filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 text-sm font-medium transition-all disabled:opacity-50"
          >
            {isRemindingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Remind All {cycleFilter !== 'ALL' ? 'in Cycle' : ''}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stat chips ── */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <Users className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs text-slate-500">Total Pending</p>
            <p className="text-xl font-bold text-slate-900">{enriched.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-amber-200 shadow-sm">
          <Clock className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500">Due in ≤ 3 days</p>
            <p className="text-xl font-bold text-amber-600">{dueSoon}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-red-200 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-xs text-slate-500">Overdue</p>
            <p className="text-xl font-bold text-red-600">{overdue}</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="pending-search"
            type="text"
            placeholder="Search evaluator, target, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          id="pending-cycle-filter"
          value={cycleFilter}
          onChange={(e) => setCycleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="ALL">All Cycles</option>
          {cycleOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {isFetching ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <User className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">No pending feedback found</p>
          <p className="text-sm">Try adjusting your search or cycle filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-5 py-4 text-left font-semibold">#</th>
                <th
                  className="px-5 py-4 text-left cursor-pointer hover:text-indigo-600 transition-colors select-none font-semibold"
                  onClick={() => handleSort('evaluatorName')}
                >
                  Evaluator <SortIcon col="evaluatorName" />
                </th>
                <th
                  className="px-5 py-4 text-left cursor-pointer hover:text-indigo-600 transition-colors select-none font-semibold"
                  onClick={() => handleSort('targetUserName')}
                >
                  Target Employee <SortIcon col="targetUserName" />
                </th>
                <th className="px-5 py-4 text-left font-semibold">Relationship</th>
                <th
                  className="px-5 py-4 text-left cursor-pointer hover:text-indigo-600 transition-colors select-none font-semibold"
                  onClick={() => handleSort('cycleName')}
                >
                  Cycle <SortIcon col="cycleName" />
                </th>
                  <th
                    className="px-5 py-4 text-left cursor-pointer hover:text-indigo-600 transition-colors select-none font-semibold"
                    onClick={() => handleSort('daysRemaining')}
                  >
                    Days Remaining <SortIcon col="daysRemaining" />
                  </th>
                  <th className="px-5 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item, idx) => (
                  <tr
                    key={item.requestId}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-4 text-slate-400">{idx + 1}</td>
  
                    {/* Evaluator */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.evaluatorName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.evaluatorDepartmentName}</p>
                    </td>
  
                    {/* Target */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.targetUserName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.targetDepartmentName}</p>
                    </td>
  
                    {/* Relationship */}
                    <td className="px-5 py-4">
                      <RelationshipBadge rel={item.relationship} />
                    </td>
  
                    {/* Cycle */}
                    <td className="px-5 py-4">
                      <p className="text-slate-900 font-medium">{item.cycleName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Due {new Date(item.cycleEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
  
                    {/* Days remaining */}
                    <td className="px-5 py-4">
                      <DaysChip days={item.daysRemaining} />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleSendReminder(item.requestId)}
                        disabled={isReminding}
                        title="Send Reminder"
                        className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
          <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100 bg-slate-50/30">
            Showing {sorted.length} of {enriched.length} records
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingFeedbackList;
