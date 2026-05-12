import React, { useState } from 'react';
import { Zap, RefreshCcw, Bell, Search, User, Briefcase } from 'lucide-react';
import type { FeedbackRequestResponse } from '../../features/feedback360/feedback360Types';

interface RequestTableProps {
  requests: FeedbackRequestResponse[] | undefined;
  isLoading: boolean;
  title: string;
}

export const FeedbackRequestTable: React.FC<RequestTableProps> = ({ 
  requests, 
  isLoading, 
  title 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center py-32 gap-6 text-slate-400">
        <div className="p-4 bg-indigo-50 rounded-2xl">
          <RefreshCcw className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
        <p className="font-bold text-lg animate-pulse text-slate-600">Syncing assignments...</p>
      </div>
    );
  }

  const filteredRequests = requests?.filter(req => 
    req.targetUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.evaluatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.targetDepartmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!requests || requests.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
        <div className="p-6 bg-slate-50 rounded-full">
          <Zap className="w-12 h-12 text-slate-200" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No Assignments Yet</h3>
        <p className="text-slate-500">Run a preview or generate requests to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col h-full transition-all duration-500">
      {/* Table Header */}
      <div className="p-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-slate-500 font-medium mt-1">
            <span className="text-indigo-600 font-bold">{filteredRequests?.length}</span> filtered from {requests.length} total
          </p>
        </div>

        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-600/20 transition-all"
          />
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="pl-8 pr-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Employee</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Evaluator</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Relationship</th>
              <th className="pl-6 pr-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {filteredRequests?.map((req, i) => (
              <tr key={`req-${req.id || i}`} className="hover:bg-slate-50/50 transition-all duration-300 group">
                <td className="pl-8 pr-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                      {req.targetUserName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{req.targetUserName}</div>
                      <div className="text-xs text-slate-500 font-medium">{req.targetDepartmentName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-slate-200 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">{req.evaluatorName}</div>
                      <div className="text-xs text-slate-500 font-medium">{req.evaluatorDepartmentName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    req.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-lg border ${
                      req.relationship === 'MANAGER' || req.relationship === 'SUPERIOR' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      req.relationship === 'PEER' ? 'bg-teal-50 text-teal-600 border-teal-100' :
                      req.relationship === 'SUBORDINATE' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {req.relationship}
                    </span>
                  </div>
                </td>
                <td className="pl-6 pr-8 py-5 text-right">
                  {req.status === 'PENDING' ? (
                    <button 
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100 transition-all active:scale-90"
                      title="Send Nudge"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500">
                      <Zap className="w-4 h-4 fill-emerald-500" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
