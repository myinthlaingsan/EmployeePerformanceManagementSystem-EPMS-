import React, { useState } from 'react';
import { useGetDepartmentsQuery } from '../features/org/departmentApi';
import { useGetEmployeesQuery } from '../features/employee/employeeapi';
import { useGetPerformanceHistoryByEmployeeQuery, useGetAllPerformanceHistoryQuery } from '../features/continuous/continuousApi';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

const SentimentChart = ({ history, employeeName, filterType }: { history: any[], employeeName?: string, filterType: string }) => {
  // Group data by month for the last 6 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const last6Months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      name: months[d.getMonth()],
      month: d.getMonth(),
      year: d.getFullYear(),
      praise: 0,
      improvement: 0,
      warning: 0,
      meetings: 0
    });
  }

  history.forEach(h => {
    const date = new Date(h.createdAt);
    const monthData = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
    if (monthData) {
      if (h.sourceType === 'MEETING') {
        monthData.meetings++;
      } else if (h.sourceType === 'FEEDBACK') {
        // Only include INITIAL feedback data (ignore replies for calculations)
        const isReply = h.title.toLowerCase().includes('reply');
        if (isReply) return;

        const titleLower = h.title.toLowerCase();
        const descLower = h.description.toLowerCase();
        const type = h.feedbackType || (
          titleLower.includes('praise') ? 'PRAISE' : 
          (titleLower.includes('improvement') || descLower.includes('improvement')) ? 'IMPROVEMENT' :
          (titleLower.includes('warning') || titleLower.includes('delete')) ? 'WARNING' : null
        );

        if (type === 'PRAISE') monthData.praise++;
        else if (type === 'IMPROVEMENT') monthData.improvement++;
        else if (type === 'WARNING') monthData.warning++;
        else monthData.praise++; // Default to neutral/praise
      }
    }
  });

  const isMeetingOnly = filterType === 'MEETING';
  const maxValue = isMeetingOnly 
    ? Math.max(...last6Months.map(m => m.meetings), 5)
    : Math.max(...last6Months.map(m => m.praise + m.improvement + m.warning), 5);

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {isMeetingOnly ? 'Meeting Volume' : 'Sentiment Distribution'}
          </p>
          <h3 className="text-xl font-black text-gray-900">
            {isMeetingOnly ? 'Meeting Frequency' : 'Historical Pulse'}{employeeName ? `: ${employeeName}` : ''}
          </h3>
        </div>
        <div className="flex gap-4">
          {!isMeetingOnly ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Praise</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Improvement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Correction</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase">Meetings Held</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative h-64 w-full flex items-end justify-between gap-4 px-2">
        {/* Y-Axis Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <div key={i} className="absolute w-full border-t border-gray-50 z-0" style={{ bottom: `${p * 100}%` }} />
        ))}

        {last6Months.map((m, i) => {
          if (isMeetingOnly) {
            const height = (m.meetings / maxValue) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 z-10 group relative">
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                  {m.meetings} {m.meetings === 1 ? 'Meeting' : 'Meetings'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                </div>

                <div className="w-full max-w-[40px] flex flex-col-reverse rounded-xl overflow-hidden h-48 bg-gray-50/50 shadow-inner">
                  <div style={{ height: `${height}%` }} className="bg-blue-500 transition-all duration-500 hover:brightness-110" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase">{m.name}</span>
              </div>
            );
          }

          const praiseH = (m.praise / maxValue) * 100;
          const improvementH = (m.improvement / maxValue) * 100;
          const warningH = (m.warning / maxValue) * 100;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 z-10 group relative">
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-4 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20 space-y-1">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Praise: {m.praise}</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Improvement: {m.improvement}</div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Correction: {m.warning}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
              </div>

              <div className="w-full max-w-[40px] flex flex-col-reverse rounded-xl overflow-hidden h-48 bg-gray-50/50 shadow-inner">
                <div style={{ height: `${praiseH}%` }} className="bg-emerald-500 transition-all duration-500 hover:brightness-110" />
                <div style={{ height: `${improvementH}%` }} className="bg-amber-400 transition-all duration-500 hover:brightness-110" />
                <div style={{ height: `${warningH}%` }} className="bg-rose-500 transition-all duration-500 hover:brightness-110" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase">{m.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminStats = ({ history }: { history: any[] }) => {
  const initialFeedback = history.filter(h => h.sourceType === 'FEEDBACK' && !h.title.toLowerCase().includes('reply'));
  const praiseCount = initialFeedback.filter(h => {
    const titleLower = h.title.toLowerCase();
    const descLower = h.description.toLowerCase();
    const type = h.feedbackType || (
      titleLower.includes('praise') ? 'PRAISE' : 
      (titleLower.includes('improvement') || descLower.includes('improvement')) ? 'IMPROVEMENT' :
      (titleLower.includes('warning') || titleLower.includes('delete')) ? 'WARNING' : null
    );
    return type === 'PRAISE';
  }).length;
  const totalFeedback = initialFeedback.length;
  const praisePercentage = totalFeedback > 0 ? Math.round((praiseCount / totalFeedback) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company-Wide Sentiment</p>
          <h3 className="text-3xl font-black text-gray-900">{praisePercentage}% Praise</h3>
          <p className="text-xs text-gray-500 font-medium">Real-time organizational health metrics.</p>
        </div>
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
            <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * praisePercentage) / 100} className="text-indigo-600" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-indigo-600 uppercase tracking-tighter">Pulse</div>
        </div>
      </div>
    </div>
  );
};

export const PerformanceHistoryPage = () => {
  const { user, isAdmin, isHR } = useAuth();
  const isGovernanceMode = isAdmin || isHR;
  const { data: departments, isLoading: isDeptsLoading } = useGetDepartmentsQuery();
  const { data: employees, isLoading: isEmpsLoading } = useGetEmployeesQuery();

  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [filterType, setFilterType] = useState<'ALL' | 'FEEDBACK' | 'MEETING'>('ALL');

  const { data: employeeHistory, isLoading: isEmpHistoryLoading } = useGetPerformanceHistoryByEmployeeQuery(
    Number(selectedEmpId), 
    { skip: !selectedEmpId }
  );

  const { data: globalHistory, isLoading: isGlobalHistoryLoading } = useGetAllPerformanceHistoryQuery(
    undefined,
    { skip: !isGovernanceMode || !!selectedEmpId }
  );

  const history = selectedEmpId ? employeeHistory : globalHistory;
  const isHistoryLoading = selectedEmpId ? isEmpHistoryLoading : isGlobalHistoryLoading;

  const filteredEmployees = employees?.filter(emp => 
    selectedDeptId ? emp.currentDepartmentId === selectedDeptId : false
  ) || [];

  const filteredHistory = history?.filter(record => 
    filterType === 'ALL' ? true : record.sourceType === filterType
  ) || [];

  const selectedEmployeeName = employees?.find(e => e.id === selectedEmpId)?.staffName;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isGovernanceMode && (
        <div className="bg-gray-900 text-white px-6 py-2 rounded-2xl flex items-center gap-3 shadow-lg shadow-gray-200">
           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Admin Mode: Content Privacy Enforced</span>
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          {isGovernanceMode ? "The Global Pulse" : "Performance History Tracker"}
        </h1>
        <p className="text-gray-500 font-medium">
          {isGovernanceMode ? "Real-time organizational performance & feedback health." : "View chronological performance activities, feedback, and 1-on-1 meeting records."}
        </p>
      </header>

      {isGovernanceMode && history && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AdminStats history={history} />
          </div>
          <div className="lg:col-span-2">
            <SentimentChart 
              history={history} 
              employeeName={selectedEmployeeName} 
              filterType={filterType}
            />
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Department</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value === '' ? '' : Number(e.target.value));
              setSelectedEmpId(''); // Reset employee selection when department changes
            }}
            disabled={isDeptsLoading}
          >
            <option value="">All Departments</option>
            {departments?.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Employee</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={!selectedDeptId || isEmpsLoading || filteredEmployees.length === 0}
          >
            <option value="">{selectedDeptId ? "Choose an Employee..." : "Select a Department First"}</option>
            {filteredEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.staffName} ({emp.positionName})</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Activity Type</label>
          <select
            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="ALL">All Activities</option>
            <option value="FEEDBACK">Feedback Only</option>
            <option value="MEETING">Meetings Only</option>
          </select>
        </div>
      </div>

      {/* History Timeline Section */}
      {selectedEmpId || isGovernanceMode ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {isGovernanceMode ? "Audit Log / Transparent History" : "Performance Timeline"}
            </h2>
            {isGovernanceMode && (
              <button className="px-6 py-2 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition flex items-center gap-2 border border-gray-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
              </button>
            )}
          </div>
          
          {isHistoryLoading ? (
            <div className="text-center py-20 text-gray-400 font-black uppercase tracking-widest animate-pulse">Analyzing Performance Data...</div>
          ) : filteredHistory && filteredHistory.length > 0 ? (
            isGovernanceMode && !selectedEmpId ? (
              /* Admin Table View */
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Timestamp</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Participants</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Tag/Type</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Content Metadata</th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredHistory.map((record) => (
                      <tr key={record.historyId} className="group hover:bg-gray-50/50 transition">
                        <td className="py-4 px-2">
                           <p className="text-[10px] font-bold text-gray-900">{format(new Date(record.createdAt), 'MMM d, p')}</p>
                        </td>
                        <td className="py-4 px-2">
                           <div className="flex flex-col">
                              <p className="text-xs font-black text-gray-900">{record.performerName}</p>
                              <p className="text-[10px] font-bold text-gray-400 tracking-tighter">to {record.employeeName}</p>
                           </div>
                        </td>
                        <td className="py-4 px-2">
                           <div className="flex flex-col gap-1">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest w-fit ${
                                record.sourceType === 'FEEDBACK' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {record.sourceType === 'FEEDBACK' ? record.title.split(' ')[0] : 'Meeting'}
                              </span>
                              {record.feedbackType && (
                                <span className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border w-fit ${
                                  record.feedbackType === 'PRAISE' ? 'bg-green-50 text-green-600 border-green-100' :
                                  record.feedbackType === 'IMPROVEMENT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                  {record.feedbackType}
                                </span>
                              )}
                              {record.tagName && (
                                <span className="text-[8px] font-bold text-gray-400 italic">#{record.tagName}</span>
                              )}
                           </div>
                        </td>
                        <td className="py-4 px-2 max-w-xs">
                           {record.isPrivate ? (
                             <div className="relative group/mask">
                               <p className="text-[10px] text-gray-300 blur-sm select-none truncate">{record.description}</p>
                               <div className="absolute inset-0 flex items-center justify-center gap-1.5">
                                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Confidential: Content Encrypted</span>
                               </div>
                             </div>
                           ) : (
                             <p className="text-[10px] text-gray-600 line-clamp-1 italic font-medium">"{record.description}"</p>
                           )}
                        </td>
                        <td className="py-4 px-2 text-right">
                           <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest ${record.isPrivate ? 'text-rose-500' : 'text-indigo-500'}`}>
                              <div className={`w-1 h-1 rounded-full ${record.isPrivate ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                              {record.isPrivate ? 'Private' : 'Public'}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Personal Timeline View */
              <div className="relative border-l-2 border-indigo-100 ml-4 space-y-10">
                {filteredHistory.map((record) => (
                  <div key={record.historyId} className="relative pl-10 group">
                    <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform duration-300 group-hover:scale-125 ${
                      record.sourceType === 'FEEDBACK' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`} />
                    
                    <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-indigo-50/50 transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                               record.sourceType === 'FEEDBACK' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                             }`}>
                               {record.sourceType}
                             </span>
                             {record.feedbackType && (
                               <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                 record.feedbackType === 'PRAISE' ? 'bg-green-100 text-green-700' :
                                 record.feedbackType === 'IMPROVEMENT' ? 'bg-amber-100 text-amber-700' :
                                 'bg-rose-100 text-rose-700'
                               }`}>
                                 {record.feedbackType}
                               </span>
                             )}
                             {record.tagName && (
                               <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">#{record.tagName}</span>
                             )}
                            {record.isPrivate && (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                Private
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-gray-900 text-xl tracking-tight leading-none">
                            {record.title}
                          </h3>
                          <p className="text-xs font-bold text-gray-400">
                            {record.performerId !== (selectedEmpId || user?.id) 
                              ? `Recorded by ${record.performerName}` 
                              : `Interaction with ${record.employeeId === (selectedEmpId || user?.id) ? record.managerName : record.employeeName}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{format(new Date(record.createdAt), 'MMMM d')}</p>
                          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">{format(new Date(record.createdAt), 'p')}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white rounded-2xl border border-gray-100/50 shadow-inner-sm italic text-gray-600 leading-relaxed">
                        "{record.description}"
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 font-black uppercase tracking-widest">No activity found in the logs.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-24 bg-indigo-50/50 rounded-[2.5rem] border-2 border-dashed border-indigo-100/50 space-y-4">
          <div className="w-20 h-20 bg-indigo-100 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-400 shadow-sm">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-indigo-400 font-black uppercase tracking-widest text-sm">Targeted Insights: Select an employee to begin analysis</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceHistoryPage;
