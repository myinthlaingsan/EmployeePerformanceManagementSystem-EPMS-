import React, { useState, useMemo } from 'react';
import { useGetActiveDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { 
  useGetPerformanceHistoryByEmployeeQuery, 
  useGetAllPerformanceHistoryQuery,
  useGetPerformancePulseQuery,
  useGetMeetingPulseQuery 
} from '../../features/continuous/continuousApi';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

interface MonthData {
  name: string;
  month: number;
  year: number;
  praise: number;
  praisePublic: number;
  praisePrivate: number;
  improvement: number;
  improvementPublic: number;
  improvementPrivate: number;
  warning: number;
  warningPublic: number;
  warningPrivate: number;
  meetings: number;
  meetingsPublic: number;
  meetingsPrivate: number;
  actionItemsCompleted: number;
  totalActionItems: number;
}

const SentimentChart = ({ history, employeeName, filterType, actionItems = [] }: { history: any[], employeeName?: string, filterType: string, actionItems?: any[] }) => {
  const [timeRange, setTimeRange] = useState<3 | 6 | 12>(6);
  const [showPraise, setShowPraise] = useState(true);
  const [showImprovement, setShowImprovement] = useState(true);
  const [showCorrection, setShowCorrection] = useState(true);

  // Group data by month for the selected time range
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData: MonthData[] = [];
  const now = new Date();
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartData.push({
      name: months[d.getMonth()],
      month: d.getMonth(),
      year: d.getFullYear(),
      praise: 0,
      praisePublic: 0,
      praisePrivate: 0,
      improvement: 0,
      improvementPublic: 0,
      improvementPrivate: 0,
      warning: 0,
      warningPublic: 0,
      warningPrivate: 0,
      meetings: 0,
      meetingsPublic: 0,
      meetingsPrivate: 0,
      actionItemsCompleted: 0,
      totalActionItems: 0
    });
  }

  // Use Sets to track unique entities per month to avoid double-counting lifecycle events
  // (e.g. a meeting that is Scheduled, Updated, then Published counts as ONE meeting).
  const uniqueMeetingsPerMonth = new Map<string, Set<number>>();
  const uniqueFeedbacksPerMonth = new Map<string, Set<number>>();

  history.forEach(h => {
    const date = new Date(h.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const monthData = chartData.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
    if (monthData) {
      if (h.sourceType === 'MEETING') {
        if (!uniqueMeetingsPerMonth.has(monthKey)) uniqueMeetingsPerMonth.set(monthKey, new Set());
        const meetingSet = uniqueMeetingsPerMonth.get(monthKey)!;
        if (!meetingSet.has(h.sourceId)) {
          meetingSet.add(h.sourceId);
          monthData.meetings++;
        }
      } else if (h.sourceType === 'FEEDBACK') {
        if (!uniqueFeedbacksPerMonth.has(monthKey)) uniqueFeedbacksPerMonth.set(monthKey, new Set());
        const feedbackSet = uniqueFeedbacksPerMonth.get(monthKey)!;
        if (!feedbackSet.has(h.sourceId)) {
          feedbackSet.add(h.sourceId);
          const type: string = h.feedbackType || 'PRAISE';
          if (type === 'PRAISE') {
            monthData.praise++;
          } else if (type === 'IMPROVEMENT') {
            monthData.improvement++;
          } else if (type === 'WARNING') {
            monthData.warning++;
          }
        }
      }
    }
  });

  // Action Items analytics per month.
  // Bucket by dueDate. If dueDate is missing or outside the chart window,
  // fall back to the CURRENT month so the item is always counted somewhere visible.
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  actionItems.forEach(ai => {
    // Determine the month to credit this action item to
    let targetMonth: { month: number; year: number } | undefined;
    if (ai.dueDate) {
      const dueDate = new Date(ai.dueDate);
      const slot = chartData.find(m => m.month === dueDate.getMonth() && m.year === dueDate.getFullYear());
      if (slot) targetMonth = slot;
    }
    // Fallback: if no dueDate or dueDate out of range, use current month
    if (!targetMonth) {
      targetMonth = chartData.find(m => m.month === nowMonth && m.year === nowYear);
    }
    if (targetMonth) {
      (targetMonth as any).totalActionItems++;
    }

    if (ai.status === 'DONE' && ai.completedAt) {
      const completedDate = new Date(ai.completedAt);
      const monthData = chartData.find(m => m.month === completedDate.getMonth() && m.year === completedDate.getFullYear());
      if (monthData) {
        monthData.actionItemsCompleted++;
      }
    }
  });

  const isMeetingOnly = filterType === 'MEETING';
  // maxValue must be the highest COUNT of any single metric in any month.
  const maxValue = isMeetingOnly
    ? Math.max(...chartData.map(m => Math.max(m.meetings, m.actionItemsCompleted)), 5)
    : filterType === 'ALL'
    ? Math.max(
        ...chartData.flatMap(m => [
          showPraise ? m.praise : 0,
          showImprovement ? m.improvement : 0,
          showCorrection ? m.warning : 0,
          m.meetings
        ]),
        5
      )
    : Math.max(
        ...chartData.flatMap(m => [
          showPraise ? m.praise : 0,
          showImprovement ? m.improvement : 0,
          showCorrection ? m.warning : 0,
        ]),
        5
      );

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
            {isMeetingOnly ? 'Meeting Volume' : filterType === 'ALL' ? 'Activity Overview' : 'Sentiment Distribution'}
          </p>
          <h3 className="text-base font-medium text-gray-900">
            {isMeetingOnly ? 'Meeting Frequency' : filterType === 'ALL' ? 'Unified Activity Pulse' : 'Historical Pulse'}{employeeName ? `: ${employeeName}` : ''}
          </h3>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value) as 3 | 6 | 12)}
            className="px-4 py-2 bg-transparent hover:bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-500 uppercase tracking-wider outline-none transition cursor-pointer appearance-none"
            style={{ backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '12px', paddingRight: '32px' }}
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>

          <div className="flex flex-wrap justify-end gap-x-6 gap-y-2">
            {!isMeetingOnly ? (
              <>
                <button 
                  onClick={() => setShowPraise(!showPraise)}
                  className={`flex items-center gap-1.5 transition-all duration-300 hover:opacity-80 ${showPraise ? 'opacity-100' : 'opacity-40 grayscale'}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Praise</span>
                </button>
                <button 
                  onClick={() => setShowImprovement(!showImprovement)}
                  className={`flex items-center gap-1.5 transition-all duration-300 hover:opacity-80 ${showImprovement ? 'opacity-100' : 'opacity-40 grayscale'}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-200" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Improvement</span>
                </button>
                <button 
                  onClick={() => setShowCorrection(!showCorrection)}
                  className={`flex items-center gap-1.5 transition-all duration-300 hover:opacity-80 ${showCorrection ? 'opacity-100' : 'opacity-40 grayscale'}`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Correction</span>
                </button>
                {filterType === 'ALL' && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
                    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Meetings</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Meetings</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full">
        {/* Y-Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} className="absolute w-full border-t border-gray-50 z-0" style={{ bottom: `${p * 100}%` }}>
            <span className="absolute -left-8 -top-2 text-[11px] font-medium text-gray-300">
              {Math.round(p * maxValue)}
            </span>
          </div>
        ))}

        <svg className="w-full h-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 500 200">
          <defs>
            <linearGradient id="praiseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="improveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="warningGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="meetingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {(() => {
            const width = 500;
            const height = 200;
            const points = chartData.length;
            const dx = width / (points - 1 || 1);

            // Build a smooth cubic-Bézier path for a single metric.
            const getPath = (getData: (m: MonthData) => number): string => {
              let path = '';
              let prevY = 0;
              chartData.forEach((m, i) => {
                const x = i * dx;
                const y = height - (getData(m) / maxValue) * height;
                if (i === 0) {
                  path = `M ${x} ${y}`;
                } else {
                  const prevX = (i - 1) * dx;
                  const cpX = prevX + (x - prevX) / 2;
                  path += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
                }
                prevY = y;
              });
              return path;
            };

            const fillPath = (path: string) => `${path} L ${width} ${height} L 0 ${height} Z`;

            if (isMeetingOnly) {
              const dx = width / (chartData.length - 1 || 1);
              const meetingPath = getPath(m => m.meetings);
              const actionPath = getPath(m => m.actionItemsCompleted);

              return (
                <>
                  {/* Bars for Meetings */}
                  {chartData.map((m, i) => {
                    const barWidth = 20;
                    const val = m.meetings;
                    const h = (val / maxValue) * height;
                    const x = i * dx - barWidth / 2;
                    const y = height - h;
                    return (
                      <rect 
                        key={`bar-${i}`}
                        x={x} y={y} width={barWidth} height={h}
                        fill="url(#meetingGrad)"
                        rx="4"
                        className="transition-all duration-500"
                      />
                    );
                  })}
                  
                  {/* Line for Action Items Completed */}
                  <path d={actionPath} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 4" className="transition-all duration-500" />
                  {chartData.map((m, i) => {
                    const x = i * dx;
                    const y = height - (m.actionItemsCompleted / maxValue) * height;
                    return (
                      <circle key={`dot-${i}`} cx={x} cy={y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" />
                    );
                  })}
                </>
              );
            }

            // Each metric is its own independent line — no stacking.
            const praiseP     = getPath(m => m.praise);
            const improvementP = getPath(m => m.improvement);
            const correctionP  = getPath(m => m.warning);

            return (
              <>
                {filterType === 'ALL' && chartData.map((m, i) => {
                  const barWidth = 16;
                  const val = m.meetings;
                  const h = (val / maxValue) * height;
                  const x = i * dx - barWidth / 2;
                  const y = height - h;
                  return (
                    <rect 
                      key={`bar-${i}`}
                      x={x} y={y} width={barWidth} height={h}
                      fill="url(#meetingGrad)"
                      rx="3"
                      className="transition-all duration-500 opacity-60 hover:opacity-100"
                    />
                  );
                })}

                {showPraise && <path d={fillPath(praiseP)}      fill="url(#praiseGrad)" className="transition-all duration-500 opacity-30" />}
                {showImprovement && <path d={fillPath(improvementP)} fill="url(#improveGrad)" className="transition-all duration-500 opacity-30" />}
                {showCorrection && <path d={fillPath(correctionP)}  fill="url(#warningGrad)" className="transition-all duration-500 opacity-30" />}

                {showPraise && <path d={praiseP}      fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />}
                {showImprovement && <path d={improvementP} fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />}
                {showCorrection && <path d={correctionP}  fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />}
              </>
            );
          })()}
        </svg>

        {/* Legend / X-Axis Labels */}
        <div className="absolute inset-0 flex justify-between items-end pointer-events-none px-0">
          {chartData.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group relative pointer-events-auto">
              <div className="w-px h-64 bg-transparent group-hover:bg-[#F0F2F6] transition-colors relative">
                <div className="absolute -top-36 left-1/2 -translate-x-1/2 bg-[#F5F6F8] border border-[#E4E6EC] text-[#111827] text-[11px] font-medium px-4 py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 space-y-1.5">
                  <p className="text-[#9EA3B0] mb-1">{m.name} {m.year}</p>
                  {!isMeetingOnly ? (
                    <>
                      {showPraise && (
                        <div className="flex items-center gap-3 justify-between">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Praise</div>
                          <span className="font-medium">{m.praise}</span>
                        </div>
                      )}
                      {showImprovement && (
                        <div className="flex items-center gap-3 justify-between">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400" /> Improvement</div>
                          <span className="font-medium">{m.improvement}</span>
                        </div>
                      )}
                      {showCorrection && (
                        <div className="flex items-center gap-3 justify-between">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> Correction</div>
                          <span className="font-medium">{m.warning}</span>
                        </div>
                      )}
                      {filterType === 'ALL' && (
                        <div className="flex items-center gap-3 justify-between border-t border-white/10 pt-1.5 mt-1.5">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Meetings</div>
                          <span className="font-medium">{m.meetings}</span>
                        </div>
                      )}
                      {!showPraise && !showImprovement && !showCorrection && (
                        <div className="text-gray-500 italic text-[11px] text-center">No metrics selected</div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Meetings</div>
                        <span className="font-medium">{m.meetings}</span>
                      </div>
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400" /> Total Tasks</div>
                        <span className="font-medium">{m.totalActionItems}</span>
                      </div>
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Tasks Done</div>
                        <span className="font-medium">{m.actionItemsCompleted}</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#E4E6EC]" />
                </div>
              </div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider bg-white px-2 mb-[-24px] z-20">
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const MeetingStats = ({ total, completed, isManagerView, departmentName, employeeName }: { total: number, completed: number, isManagerView: boolean, departmentName?: string, employeeName?: string }) => {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  
  const headerLabel = employeeName 
    ? `${employeeName}'s Action Items` 
    : isManagerView 
      ? `${departmentName || 'Department'} Action Items` 
      : 'Company-Wide Action Items';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{headerLabel}</p>
        <h3 className="text-3xl font-medium text-gray-900">{total} <span className="text-base font-medium text-gray-400">Tasks</span></h3>
        <p className="text-xs text-gray-500 font-medium">
          {completed} / {total} completed &nbsp;·&nbsp; {completionRate}% done
        </p>
      </div>
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" strokeWidth="10" 
            fill="transparent" className="text-gray-100" 
          />
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" strokeWidth="10" 
            fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={circumference - (circumference * completionRate) / 100} 
            strokeLinecap="round"
            className="text-[#1A56DB] transition-all duration-1000 ease-out" 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-medium text-[#1A56DB]">{completionRate}%</span>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Done</span>
        </div>
      </div>
    </div>
  );
};

const AdminStats = ({ history, isManagerView, departmentName, employeeName }: { history: any[], isManagerView?: boolean, departmentName?: string, employeeName?: string }) => {
  // Backend returns one deduped row per entity with up-to-date feedbackType.
  const feedbacks = history.filter(h => h.sourceType === 'FEEDBACK');
  const total = feedbacks.length;

  const praise = feedbacks.filter(h => h.feedbackType === 'PRAISE').length;
  const improvement = feedbacks.filter(h => h.feedbackType === 'IMPROVEMENT').length;
  const correction = feedbacks.filter(h => h.feedbackType === 'WARNING').length;

  const pPerc = total > 0 ? Math.round((praise / total) * 100) : 0;
  const iPerc = total > 0 ? Math.round((improvement / total) * 100) : 0;
  const cPerc = total > 0 ? Math.round((correction / total) * 100) : 0;

  const label = employeeName ? `${employeeName}'s Sentiment` : isManagerView ? `${departmentName} Sentiment` : 'Company-Wide Sentiment';

  const radius = 38;
  const stroke = 9;
  const circumference = 2 * Math.PI * radius;
  const gap = 2;
  const gapFrac = gap / 360;

  const pFrac = total > 0 ? praise / total : 0;
  const iFrac = total > 0 ? improvement / total : 0;
  const cFrac = total > 0 ? correction / total : 0;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Feedback Sentiment</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5 truncate max-w-[160px]">{label}</p>
        </div>
        <span className="text-[11px] font-medium bg-[#F5F6F8] text-gray-600 px-3 py-1 rounded-lg border border-gray-200">{total} total</span>
      </div>

      {/* Donut Chart centered with total inside */}
      <div className="flex justify-center">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} stroke="#f3f4f6" strokeWidth={stroke} fill="transparent" />
            {total === 0 ? (
              <circle cx="48" cy="48" r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="transparent"
                strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * 0.25} />
            ) : (
              <>
                {/* Praise arc — starts at 12 o'clock */}
                <circle cx="48" cy="48" r={radius} stroke="#10b981" strokeWidth={stroke} fill="transparent"
                  strokeDasharray={`${pFrac * circumference} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                  style={{ transformOrigin: '48px 48px', transform: `rotate(0deg)` }}
                  className="transition-all duration-1000" />
                {/* Improvement arc — rotated to start after Praise */}
                <circle cx="48" cy="48" r={radius} stroke="#fbbf24" strokeWidth={stroke} fill="transparent"
                  strokeDasharray={`${iFrac * circumference} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                  style={{ transformOrigin: '48px 48px', transform: `rotate(${pFrac * 360}deg)` }}
                  className="transition-all duration-1000" />
                {/* Correction arc — rotated to start after Praise + Improvement */}
                <circle cx="48" cy="48" r={radius} stroke="#f43f5e" strokeWidth={stroke} fill="transparent"
                  strokeDasharray={`${cFrac * circumference} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                  style={{ transformOrigin: '48px 48px', transform: `rotate(${(pFrac + iFrac) * 360}deg)` }}
                  className="transition-all duration-1000" />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-medium text-gray-900">{total}</span>
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">feedbacks</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-gray-600">Praise</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-gray-900">{praise}</span>
              <span className="text-[11px] font-medium text-gray-400">{pPerc}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pPerc}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-medium text-gray-600">Improvement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-gray-900">{improvement}</span>
              <span className="text-[11px] font-medium text-gray-400">{iPerc}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${iPerc}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-medium text-gray-600">Correction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-gray-900">{correction}</span>
              <span className="text-[11px] font-medium text-gray-400">{cPerc}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${cPerc}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Combined Stats card: Feedback + Meetings in one view ─────────────────────
const CombinedStats = ({
  history, meetingTotal, meetingCompleted, employeeName, departmentName
}: {
  history: any[];
  meetingTotal: number;
  meetingCompleted: number;
  employeeName?: string;
  departmentName?: string;
}) => {
  const feedbackCount = history.filter(h => h.sourceType === 'FEEDBACK').length;
  const meetingCount  = history.filter(h => h.sourceType === 'MEETING').length;
  const total = feedbackCount + meetingCount;
  const completionRate = meetingTotal > 0 ? Math.round((meetingCompleted / meetingTotal) * 100) : 0;
  const label = employeeName ? `${employeeName}'s Activity` : departmentName ? `${departmentName} Activity` : 'Department Activity';

  const bars = [
    { label: 'Feedback', value: feedbackCount, color: '#10b981' },
    { label: 'Meetings', value: meetingCount,  color: '#2563eb' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-4 h-full">
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{label}</p>
        <h3 className="text-5xl font-medium text-gray-900 tabular-nums">{total}</h3>
        <p className="text-xs text-gray-400 font-medium">Total published interactions</p>
      </div>

      <div className="space-y-3 flex-1">
        {bars.map(({ label: l, value, color }) => (
          <div key={l} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">{l}</span>
              </div>
              <span className="text-[11px] font-medium text-gray-700">{value}</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: total > 0 ? `${(value / total) * 100}%` : '0%', background: color }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Action Items</p>
          <p className="text-lg font-medium text-gray-900">{completionRate}% Done</p>
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-gray-100" />
            <circle
              cx="24" cy="24" r="18"
              stroke="currentColor" strokeWidth="5" fill="transparent"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - completionRate / 100)}`}
              strokeLinecap="round"
              className="text-blue-500 transition-all duration-1000 ease-out"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Special Manager-Tracking Components ─────────────────────────────────────

const ManagerialActivityChart = ({ history, managerName, managerId, timeRange, onTimeRangeChange, filterType }: { history: any[], managerName: string, managerId: number, timeRange: number, onTimeRangeChange: (val: number) => void, filterType: string }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const chartData: { name: string; month: number; year: number; praise: number; improvement: number; correction: number; meetings: number; }[] = [];
  
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartData.push({ name: months[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), praise: 0, improvement: 0, correction: 0, meetings: 0 });
  }

  // Use a Set to track unique entities per month to avoid double-counting life-cycle events
  const uniqueMeetingsPerMonth = new Map<string, Set<number>>();
  const uniqueFeedbacksPerMonth = new Map<string, Set<number>>();

  history.forEach(h => {
    if (h.performerId !== managerId) return;
    const date = new Date(h.createdAt);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const slot = chartData.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
    if (!slot) return;

    if (h.sourceType === 'MEETING') {
      if (!uniqueMeetingsPerMonth.has(monthKey)) uniqueMeetingsPerMonth.set(monthKey, new Set());
      const meetingSet = uniqueMeetingsPerMonth.get(monthKey)!;
      
      if (!meetingSet.has(h.sourceId)) {
        meetingSet.add(h.sourceId);
        slot.meetings++;
      }
    } else if (h.sourceType === 'FEEDBACK') {
      if (!uniqueFeedbacksPerMonth.has(monthKey)) uniqueFeedbacksPerMonth.set(monthKey, new Set());
      const feedbackSet = uniqueFeedbacksPerMonth.get(monthKey)!;

      if (!feedbackSet.has(h.sourceId)) {
        feedbackSet.add(h.sourceId);
        const type = h.feedbackType || 'PRAISE';
        if (type === 'PRAISE') slot.praise++;
        else if (type === 'IMPROVEMENT') slot.improvement++;
        else if (type === 'WARNING') slot.correction++;
      }
    }
  });

  const isMeetingOnly = filterType === 'MEETING';
  const isFeedbackOnly = filterType === 'FEEDBACK';

  const maxValue = Math.max(
    ...chartData.flatMap(m => {
      if (isMeetingOnly) return [m.meetings];
      if (isFeedbackOnly) return [m.praise, m.improvement, m.correction];
      return [m.praise, m.improvement, m.correction, m.meetings];
    }), 
    5
  );

  const title = isMeetingOnly ? 'Meeting Frequency' : isFeedbackOnly ? 'Feedback Distribution' : 'Activity Distribution';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4 h-full">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Managerial Output</p>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: '#111827' }}>{title}: {managerName}</h3>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden md:flex gap-4">
            {(filterType === 'ALL' || isFeedbackOnly) && (
              <>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[11px] font-medium uppercase text-gray-400">Praise</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[11px] font-medium uppercase text-gray-400">Improve</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[11px] font-medium uppercase text-gray-400">Correct</span></div>
              </>
            )}
            {(filterType === 'ALL' || isMeetingOnly) && (
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[11px] font-medium uppercase text-gray-400">Meetings</span></div>
            )}
          </div>
          <select value={timeRange} onChange={(e) => onTimeRangeChange(Number(e.target.value))} className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium outline-none">
            <option value={3}>3 Months</option><option value={6}>6 Months</option><option value={12}>12 Months</option>
          </select>
        </div>
      </div>
      <div className="relative h-64 flex items-end justify-between gap-2 px-2">
         {/* Y-Axis Grid Lines */}
         {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} className="absolute w-full border-t border-gray-50 z-0" style={{ bottom: `${p * 100}%` }}>
            <span className="absolute -left-6 -top-2 text-[11px] font-medium text-gray-300">{Math.round(p * maxValue)}</span>
          </div>
        ))}

        {chartData.map((m, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
            {/* Tooltip */}
            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 min-w-[120px]" style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '10px 12px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, paddingBottom: 6, borderBottom: '0.5px solid #E4E6EC' }}>{m.name} {m.year}</p>
              <div className="space-y-1.5">
                {(filterType === 'ALL' || isFeedbackOnly) && (
                  <>
                    <div className="flex justify-between items-center gap-4">
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#27500A', textTransform: 'uppercase' }}>Praise</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{m.praise}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#633806', textTransform: 'uppercase' }}>Improve</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{m.improvement}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#791F1F', textTransform: 'uppercase' }}>Correct</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{m.correction}</span>
                    </div>
                  </>
                )}
                {(filterType === 'ALL' || isMeetingOnly) && (
                  <div className="flex justify-between items-center gap-4">
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#0C447C', textTransform: 'uppercase' }}>Meetings</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>{m.meetings}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45" style={{ background: '#E4E6EC' }} />
            </div>

            {/* Grouped Bars Container */}
            <div className="w-full h-48 flex items-end justify-center gap-0.5 px-1 pb-1 border-b border-gray-50">
              {(filterType === 'ALL' || isFeedbackOnly) && (
                <>
                  <div 
                    style={{ height: `${Math.max((m.praise/maxValue)*100, 2)}%` }} 
                    className="flex-1 max-w-[8px] bg-emerald-500 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-sm" 
                  />
                  <div 
                    style={{ height: `${Math.max((m.improvement/maxValue)*100, 2)}%` }} 
                    className="flex-1 max-w-[8px] bg-amber-400 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-sm" 
                  />
                  <div 
                    style={{ height: `${Math.max((m.correction/maxValue)*100, 2)}%` }} 
                    className="flex-1 max-w-[8px] bg-rose-500 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-sm" 
                  />
                </>
              )}
              {(filterType === 'ALL' || isMeetingOnly) && (
                <div 
                  style={{ height: `${Math.max((m.meetings/maxValue)*100, 2)}%` }} 
                  className="flex-1 max-w-[8px] bg-blue-500 rounded-t-sm transition-all duration-500 hover:brightness-110 shadow-sm" 
                />
              )}
            </div>
            <span className="text-[11px] font-medium text-gray-400 uppercase">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ManagerActionStats = ({ history, managerId, filterType }: { history: any[], managerId: number, filterType: string }) => {
  const isFeedbackOnly = filterType === 'FEEDBACK';
  const isMeetingOnly = filterType === 'MEETING';

  if (isFeedbackOnly) {
    // Deduplicate by sourceId — keep only ONE row per unique feedback (the most recent),
    // so that edit/update events don't inflate the count.
    const managerFeedbackRows = history.filter(h => h.performerId === managerId && h.sourceType === 'FEEDBACK');
    const latestBySource = new Map<number, any>();
    managerFeedbackRows.forEach(h => {
      const existing = latestBySource.get(h.sourceId);
      if (!existing || new Date(h.createdAt) > new Date(existing.createdAt)) {
        latestBySource.set(h.sourceId, h);
      }
    });
    const uniqueFeedbacks = Array.from(latestBySource.values());

    const praise = uniqueFeedbacks.filter(h => h.feedbackType === 'PRAISE').length;
    const improvement = uniqueFeedbacks.filter(h => h.feedbackType === 'IMPROVEMENT').length;
    const correction = uniqueFeedbacks.filter(h => h.feedbackType === 'WARNING').length;
    const total = praise + improvement + correction;

    return (
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
        <div className="space-y-5">
          <div className="space-y-1">
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback Output</p>
            <h3 style={{ fontSize: 32, fontWeight: 500, color: '#111827' }}>{total}</h3>
            <p style={{ fontSize: 11, color: '#9EA3B0', fontStyle: 'italic' }}>Total feedback entries given.</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Praise',      count: praise,      bg: '#EAF3DE', text: '#27500A', bar: '#27500A' },
              { label: 'Improvement', count: improvement, bg: '#FAEEDA', text: '#633806', bar: '#633806' },
              { label: 'Correction',  count: correction,  bg: '#FCEBEB', text: '#791F1F', bar: '#791F1F' }
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#5A6070', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: item.text, background: item.bg, padding: '1px 6px', borderRadius: 4 }}>{item.count}</span>
                </div>
                <div style={{ height: 6, background: '#F5F6F8', borderRadius: 4, overflow: 'hidden', border: '0.5px solid #E4E6EC' }}>
                  <div style={{ height: '100%', background: item.bar, borderRadius: 4, width: `${total > 0 ? (item.count / total) * 100 : 0}%`, transition: 'width 0.7s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ paddingTop: 20, marginTop: 20, borderTop: '0.5px solid #E4E6EC', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#27500A' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sentiment Balance</p>
        </div>
      </div>
    );
  }

  // Default / Meeting View (Quality Control) - Deduplicate re-opens per unique action item
  const uniqueReopens = new Set<string>();
  history.forEach(h => {
    if (h.performerId === managerId && h.title.includes('Re-opened')) {
      uniqueReopens.add(`${h.sourceId}-${h.description}`);
    }
  });
  const reopens = uniqueReopens.size;

  return (
    <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
      <div className="space-y-1">
        <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quality Control</p>
        <h3 style={{ fontSize: 32, fontWeight: 500, color: '#111827' }}>{reopens}</h3>
        <p style={{ fontSize: 11, color: '#9EA3B0', fontStyle: 'italic' }}>Action items re-opened for revision.</p>
      </div>
      <div style={{ paddingTop: 20, marginTop: 20, borderTop: '0.5px solid #E4E6EC', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#791F1F' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </div>
        <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revision Frequency</p>
      </div>
    </div>
  );
};

export const PerformanceHistoryManagerPage = () => {
  const { user } = useAuth();
  const isGovernanceMode = false; // Hardcoded for this page
  const { data: departments } = useGetActiveDepartmentsQuery();
  const { data: employeeData, isLoading: isEmpsLoading } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = (employeeData?.content || []).filter(emp => emp.id !== user?.id);

  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>(user?.currentDepartmentId || '');
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<'ALL' | 'FEEDBACK' | 'MEETING'>('ALL');

  const [managerPerspective, setManagerPerspective] = useState<'conducted' | 'received'>('conducted');
  const [managerTimeRange, setManagerTimeRange] = useState(6);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Auto-select and lock department for managers
  React.useEffect(() => {
    if (user?.currentDepartmentId) {
      setSelectedDeptId(user.currentDepartmentId);
    }
  }, [user?.currentDepartmentId]);

  const selectedEmployee = employees?.find(e => e.id === selectedEmpId);
  const isManagerSelected = selectedEmployee?.roles?.some(r => r.replace("ROLE_", "") === 'MANAGER');

  const { data: employeeHistoryResponse, isLoading: isEmpHistoryLoading } = useGetPerformanceHistoryByEmployeeQuery(
    { 
      employeeId: Number(selectedEmpId), 
      sourceType: filterType,
      onlyByManager: selectedEmpId === '' 
        ? undefined 
        : (isManagerSelected && managerPerspective === 'conducted' ? false : true),
      isConducted: selectedEmpId === ''
        ? undefined
        : (isManagerSelected && managerPerspective === 'conducted' ? true : false),
      page: currentPage - 1, 
      size: itemsPerPage 
    }, 
    { skip: !selectedEmpId }
  );

  const { data: globalHistoryResponse, isLoading: isGlobalHistoryLoading } = useGetAllPerformanceHistoryQuery(
    { 
      sourceType: filterType,
      departmentId: Number(selectedDeptId),
      page: currentPage - 1, 
      size: itemsPerPage 
    },
    { skip: !!selectedEmpId }
  );

  // Always fetch both so both chart types are ready without waiting for filter change
  const { data: analyticsData } = useGetPerformancePulseQuery({
    departmentId: Number(selectedDeptId),
    employeeId: selectedEmpId === '' ? undefined : Number(selectedEmpId),
    onlyByManager: selectedEmpId === '' 
      ? undefined 
      : (isManagerSelected && managerPerspective === 'conducted' ? false : true)
  });

  const { data: meetingPulseData } = useGetMeetingPulseQuery({
    departmentId: Number(selectedDeptId),
    employeeId: selectedEmpId === '' ? undefined : Number(selectedEmpId),
    onlyByManager: selectedEmpId === '' 
      ? undefined 
      : (isManagerSelected && managerPerspective === 'conducted' ? false : true)
  });

  const managerChartHistory = useMemo(() => {
    if (!selectedEmpId) return [];
    if (meetingPulseData?.actionHistory) {
      return [...meetingPulseData.actionHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (analyticsData) {
      return analyticsData
        .filter(h => h.performerId === Number(selectedEmpId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  }, [analyticsData, meetingPulseData, selectedEmpId]);

  const receivedAnalyticsData = useMemo(() => {
    if (!selectedEmpId || !analyticsData) return [];
    return analyticsData.filter(h => h.employeeId === Number(selectedEmpId));
  }, [analyticsData, selectedEmpId]);

  // analyticsData comes from findLatestStateByEmployee which includes all roles
  // (employee.id, manager.id, performer.id, createdBy). Filtering to sourceType MEETING
  // and employeeId === selectedEmpId gives meetings WHERE the selected person is the
  // EMPLOYEE (i.e. meetings they received). meetingPulseData.meetingHistory only has
  // performer-side (conducted) history for managers, so it cannot be used here.
  const receivedMeetingHistory = useMemo(() => {
    if (!selectedEmpId || !analyticsData) return [];
    return analyticsData.filter((h: any) =>
      h.sourceType === 'MEETING' && h.employeeId === Number(selectedEmpId)
    );
  }, [analyticsData, selectedEmpId]);

  const receivedActionItems = useMemo(() => {
    if (!selectedEmpId || !meetingPulseData?.actionItems) return [];
    return meetingPulseData.actionItems.filter((ai: any) => ai.assignedToId === Number(selectedEmpId));
  }, [meetingPulseData, selectedEmpId]);

  // Action items from meetings the selected manager CONDUCTED — assigned to their subordinates
  const conductedActionItems = useMemo(() => {
    if (!selectedEmpId || !meetingPulseData?.actionItems) return [];
    return meetingPulseData.actionItems.filter((ai: any) => ai.assignedToId !== Number(selectedEmpId));
  }, [meetingPulseData, selectedEmpId]);

  const selectedDeptName = departments?.find(d => d.id === selectedDeptId)?.departmentName;
  const userRank = user?.levelRank ?? 99;
  const filteredEmployees = employees?.filter(emp => {
    if (selectedDeptName && emp.currentDepartmentName !== selectedDeptName) {
      return false;
    }
    const empRank = emp.levelRank ?? 99;
    return empRank >= userRank;
  }) || [];


  const historyResponse = selectedEmpId ? employeeHistoryResponse : globalHistoryResponse;
  const isHistoryLoading = selectedEmpId ? isEmpHistoryLoading : isGlobalHistoryLoading;
  const history = historyResponse?.content || [];

  const totalItems = historyResponse?.totalElements || 0;
  const totalPages = historyResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + history.length;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const selectedEmployeeName = employees?.find(e => e.id === selectedEmpId)?.staffName;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-2">
        <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Team Performance Tracker</h1>
        <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>View chronological performance activities, feedback, and 1-on-1 meeting records for your team.</p>
      </header>

      {(analyticsData || meetingPulseData) && (
        <div className="space-y-6">
          {isManagerSelected && selectedEmpId ? (
            /* Manager-Specific Toggleable View */
            <div className="space-y-4">
              <div className="bg-white border border-gray-200/80 rounded-xl p-1.5 flex gap-2 w-fit">
                <button
                  id="tab-conducted-activities"
                  onClick={() => setManagerPerspective('conducted')}
                  className={`px-5 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${
                    managerPerspective === 'conducted'
                      ? 'bg-[#1A56DB] text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Conducted Activities (Given)
                </button>
                <button
                  id="tab-individual-performance"
                  onClick={() => setManagerPerspective('received')}
                  className={`px-5 py-2 rounded-lg text-[12px] font-medium transition-all duration-300 ${
                    managerPerspective === 'received'
                      ? 'bg-[#1A56DB] text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Individual Performance (Received)
                </button>
              </div>

              {managerPerspective === 'conducted' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-2">
                    <ManagerialActivityChart 
                      history={managerChartHistory}
                      managerName={selectedEmployeeName || ''}
                      managerId={Number(selectedEmpId)}
                      timeRange={managerTimeRange}
                      onTimeRangeChange={setManagerTimeRange}
                      filterType={filterType}
                    />
                  </div>
                  <div className="lg:col-span-1 flex flex-col gap-4">
                    <ManagerActionStats history={managerChartHistory} managerId={Number(selectedEmpId)} filterType={filterType} />
                    {(filterType === 'ALL' || filterType === 'MEETING') && (
                      <MeetingStats
                        total={conductedActionItems.length}
                        completed={conductedActionItems.filter((ai: any) => ai.status === 'DONE').length}
                        isManagerView={true}
                        employeeName={selectedEmployeeName}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-1">
                    {filterType === 'ALL' ? (
                      <CombinedStats
                        history={receivedAnalyticsData}
                        meetingTotal={receivedActionItems.length}
                        meetingCompleted={receivedActionItems.filter((ai: any) => ai.status === 'DONE').length}
                        employeeName={selectedEmployeeName}
                      />
                    ) : filterType === 'FEEDBACK' ? (
                      <AdminStats history={receivedAnalyticsData} employeeName={selectedEmployeeName} />
                    ) : (
                      <MeetingStats
                        total={receivedActionItems.length}
                        completed={receivedActionItems.filter((ai: any) => ai.status === 'DONE').length}
                        isManagerView={false}
                        employeeName={selectedEmployeeName}
                      />
                    )}
                  </div>
                  <div className="lg:col-span-2">
                    <SentimentChart 
                      history={filterType === 'MEETING' ? receivedMeetingHistory : receivedAnalyticsData} 
                      employeeName={selectedEmployeeName} 
                      filterType={filterType}
                      actionItems={receivedActionItems}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Standard Employee View / Department View */
            <div className="space-y-8">
              {filterType === 'ALL' ? (
                /* Combined single row */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-1">
                    <CombinedStats
                      history={analyticsData || []}
                      meetingTotal={meetingPulseData?.totalActionItems || 0}
                      meetingCompleted={meetingPulseData?.completedActionItems || 0}
                      employeeName={selectedEmployeeName}
                      departmentName={user?.currentDepartmentName}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <SentimentChart
                      history={
                        selectedEmpId
                          // When an employee is selected: analyticsData (feedback, deduplicated)
                          // + meetingPulseData.meetingHistory (all meetings for that employee).
                          // SentimentChart deduplicates by sourceId internally, so no double-count.
                          ? [...(analyticsData || []), ...(meetingPulseData?.meetingHistory || [])]
                          // Department view: analyticsData already includes all meetings for the dept.
                          : (analyticsData || [])
                      }
                      employeeName={selectedEmployeeName}
                      filterType="ALL"
                      actionItems={meetingPulseData?.actionItems || []}
                    />
                  </div>
                </div>
              ) : filterType === 'FEEDBACK' ? (
                /* Feedback only */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-1">
                    <AdminStats
                      history={(analyticsData || []).filter(h => h.sourceType === 'FEEDBACK')}
                      isManagerView={true}
                      departmentName={user?.currentDepartmentName}
                      employeeName={selectedEmployeeName}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <SentimentChart
                      history={(analyticsData || []).filter(h => h.sourceType === 'FEEDBACK')}
                      employeeName={selectedEmployeeName}
                      filterType="FEEDBACK"
                      actionItems={[]}
                    />
                  </div>
                </div>
              ) : (
                /* Meeting only */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="lg:col-span-1">
                    <MeetingStats
                      total={meetingPulseData?.totalActionItems || 0}
                      completed={meetingPulseData?.completedActionItems || 0}
                      isManagerView={true}
                      departmentName={user?.currentDepartmentName}
                      employeeName={selectedEmployeeName}
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <SentimentChart
                      history={meetingPulseData?.meetingHistory || []}
                      employeeName={selectedEmployeeName}
                      filterType="MEETING"
                      actionItems={meetingPulseData?.actionItems || []}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters Section */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px', display: 'flex', flexWrap: 'wrap', gap: 16 }} className="sticky top-0 z-20">
        <div style={{ flex: '1 1 160px', minWidth: 0 }} className="space-y-1">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Department (Fixed)</label>
          <div style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#5A6070' }}>
            {user?.currentDepartmentName || "Your Department"}
          </div>
        </div>

        <div style={{ flex: '1 1 160px', minWidth: 0 }} className="space-y-1">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Select Team Member</label>
          <select
            style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', opacity: isEmpsLoading || employees.length === 0 ? 0.5 : 1 }}
            value={selectedEmpId}
            onChange={(e) => {
              setSelectedEmpId(e.target.value === '' ? '' : Number(e.target.value));
              setCurrentPage(1);
              setManagerPerspective('conducted');
            }}
            disabled={isEmpsLoading || employees.length === 0}
          >
            <option value="">{filteredEmployees.length > 0 ? "Choose an Employee..." : "No employees found"}</option>
            {filteredEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.staffName} ({emp.positionName})</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 140px', minWidth: 0 }} className="space-y-1">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Activity Type</label>
          <select
            style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">All Activities</option>
            <option value="FEEDBACK">Feedback Only</option>
            <option value="MEETING">Meetings Only</option>
          </select>
        </div>
      </div>

      {/* History Timeline Section */}
      {selectedEmpId ? (
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>Performance Timeline</h2>
          </div>

          {isHistoryLoading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analyzing Performance Data...</div>
          ) : history.length > 0 ? (
            <div className="space-y-6">
              <div style={{ borderLeft: '0.5px solid #E4E6EC', marginLeft: 14 }} className="space-y-6">
                {history.map((record) => (
                  <div key={record.historyId} style={{ position: 'relative', paddingLeft: 28 }} className="group">
                    <div style={{ position: 'absolute', left: -8, top: 6, width: 16, height: 16, borderRadius: '50%', background: record.sourceType === 'FEEDBACK' ? '#EAF3DE' : '#EEF3FD', border: `0.5px solid ${record.sourceType === 'FEEDBACK' ? '#B8DCA0' : '#B5D4F4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: record.sourceType === 'FEEDBACK' ? '#27500A' : '#0C447C', display: 'inline-block' }} />
                    </div>

                    <div style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 10, padding: '12px 14px' }} className="hover:border-[#1A56DB] transition-colors">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                        <div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                            <span style={{ background: record.sourceType === 'FEEDBACK' ? '#EAF3DE' : '#EEF3FD', color: record.sourceType === 'FEEDBACK' ? '#27500A' : '#0C447C', border: `0.5px solid ${record.sourceType === 'FEEDBACK' ? '#B8DCA0' : '#B5D4F4'}`, borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {record.sourceType}
                            </span>
                            {record.feedbackType && (
                              <span style={{ background: record.feedbackType === 'PRAISE' ? '#EAF3DE' : record.feedbackType === 'IMPROVEMENT' ? '#FAEEDA' : '#FCEBEB', color: record.feedbackType === 'PRAISE' ? '#27500A' : record.feedbackType === 'IMPROVEMENT' ? '#633806' : '#791F1F', border: `0.5px solid ${record.feedbackType === 'PRAISE' ? '#B8DCA0' : record.feedbackType === 'IMPROVEMENT' ? '#F0D4A4' : '#F5BFBF'}`, borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                {record.feedbackType}
                              </span>
                            )}
                            {record.tagName && (
                              <span style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 500, color: '#5A6070' }}>#{record.tagName}</span>
                            )}
                          </div>
                          <h3 style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{record.title}</h3>
                          <p style={{ fontSize: 11, color: '#9EA3B0', marginTop: 2 }}>
                            {record.performerId !== (selectedEmpId || user?.id)
                              ? `Recorded by ${record.performerName}`
                              : `Interaction with ${record.employeeId === (selectedEmpId || user?.id) ? record.managerName : record.employeeName}`
                            }
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: '#5A6070' }}>{format(new Date(record.createdAt), 'dd/MM/yyyy')}</p>
                          <p style={{ fontSize: 11, color: '#9EA3B0' }}>{format(new Date(record.createdAt), 'p')}</p>
                        </div>
                      </div>
                      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '8px 12px', fontStyle: 'italic', fontSize: 13, color: '#5A6070', lineHeight: 1.5 }}>
                        "{record.description}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, borderTop: '0.5px solid #E4E6EC' }}>
                  <span style={{ fontSize: 11, color: '#9EA3B0' }}>Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                      style={{ width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'transparent', color: '#9EA3B0', opacity: currentPage === 1 ? 0.3 : 1 }}>
                      <svg style={{ width: 12, height: 12, margin: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i+1} onClick={() => handlePageChange(i+1)}
                        style={{ width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: currentPage === i+1 ? '#1A56DB' : 'transparent', color: currentPage === i+1 ? '#FFFFFF' : '#9EA3B0' }}>
                        {i+1}
                      </button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                      style={{ width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: 'transparent', color: '#9EA3B0', opacity: currentPage === totalPages ? 0.3 : 1 }}>
                      <svg style={{ width: 12, height: 12, margin: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #E4E6EC', borderRadius: 8 }}>
              <svg style={{ width: 36, height: 36, color: '#E4E6EC', margin: '0 auto 10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ fontSize: 12, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>No activity found in the logs.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '64px 24px', textAlign: 'center', border: '2px dashed #E4E6EC', borderRadius: 12, background: '#F5F6F8' }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: '#EEF3FD', border: '0.5px solid #B5D4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#1A56DB' }}>
            <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p style={{ fontSize: 12, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Targeted Insights: Select a team member to begin analysis</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceHistoryManagerPage;
