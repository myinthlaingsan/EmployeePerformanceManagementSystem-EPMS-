import React, { useState } from 'react';
import {
  useGetFinancialYearsQuery,
  useCreateFinancialYearMutation,
  useSetCurrentFinancialYearMutation,
  useDeleteFinancialYearMutation,
  useRolloverFinancialYearMutation
} from '../../features/appraisal/financialYearApi';
import { 
  Plus, 
  CheckCircle2, 
  Trash2, 
  History, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { format, addYears, subDays, parseISO, isValid } from 'date-fns';

const FinancialYearManagement = () => {
  const { data: years, isLoading } = useGetFinancialYearsQuery();
  const [createYear] = useCreateFinancialYearMutation();
  const [setCurrent] = useSetCurrentFinancialYearMutation();
  const [deleteYear] = useDeleteFinancialYearMutation();
  const [rollover] = useRolloverFinancialYearMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState({
    title: '',
    startDate: '',
    endDate: '',
    isCurrent: false
  });

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startStr = e.target.value;
    if (!startStr) return;

    const startDate = parseISO(startStr);
    if (!isValid(startDate)) return;

    // Auto-calculate end date (exactly 1 year minus 1 day later)
    const calculatedEnd = subDays(addYears(startDate, 1), 1);
    const endStr = format(calculatedEnd, 'yyyy-MM-dd');

    // Auto-generate title e.g. FY 2024-2025
    const startYear = startDate.getFullYear();
    const endYear = startYear + 1;
    const generatedTitle = `FY ${startYear}-${endYear}`;

    setNewYear({
      ...newYear,
      startDate: startStr,
      endDate: endStr,
      title: newYear.title === '' || newYear.title.startsWith('FY ') ? generatedTitle : newYear.title
    });
  };

  const handleAdd = async () => {
    if (!newYear.title || !newYear.startDate || !newYear.endDate) {
      alert('Please fill all required fields');
      return;
    }

    const start = parseISO(newYear.startDate);
    const end = parseISO(newYear.endDate);

    if (end < addYears(start, 1) && format(end, 'yyyy-MM-dd') !== format(subDays(addYears(start, 1), 1), 'yyyy-MM-dd')) {
       if (!window.confirm('The selected period is less than one year. Do you want to proceed?')) {
         return;
       }
    }
    try {
      await createYear(newYear).unwrap();
      setShowAddModal(false);
      setNewYear({ title: '', startDate: '', endDate: '', isCurrent: false });
    } catch (err) {
      alert('Failed to create financial year');
    }
  };

  const handleSetCurrent = async (id: number) => {
    if (window.confirm('Set this as the current Financial Year? All others will be deactivated.')) {
      await setCurrent(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this financial year?')) {
      await deleteYear(id);
    }
  };

  const handleRollover = async () => {
    if (window.confirm('Execute Rollover? This will validate all active appraisals, create the next financial year, and archive the current one.')) {
      try {
        await rollover().unwrap();
      } catch (err: any) {
        alert(err?.data?.message || err?.error || 'Failed to rollover. Please ensure no active appraisal cycles are blocking the rollover.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Year Configuration</h2>
          <p className="text-slate-500 font-medium">Manage corporate periods and active appraisal timelines.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Initialize New FY
        </button>
      </div>

      {/* Stats / Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Periods</p>
            <p className="text-xl font-black text-slate-900">{years?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Status</p>
            <p className="text-xl font-black text-slate-900">
              {years?.filter(y => y.isCurrent || (y as any).current).length || 0} Period Live
            </p>
          </div>
        </div>
        <div 
          onClick={handleRollover}
          className="bg-indigo-900 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group cursor-pointer hover:bg-indigo-800 transition-colors"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Next Phase</p>
            <p className="text-lg font-bold text-white mt-1">Execute Rollover</p>
          </div>
          <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 text-white/10 group-hover:translate-x-2 transition-transform" />
        </div>
      </div>

      {/* FY List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Year Title</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">Loading periods...</td></tr>
            ) : years?.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No financial years configured.</td></tr>
            ) : years?.map((year) => {
              const isCurrent = year.isCurrent || (year as any).current;
              return (
              <tr key={year.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`}></div>
                    <span className="font-bold text-slate-800">{year.title}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500">{format(new Date(year.startDate), 'MMM dd, yyyy')}</td>
                <td className="px-8 py-6 text-sm font-medium text-slate-500">{format(new Date(year.endDate), 'MMM dd, yyyy')}</td>
                <td className="px-8 py-6">
                  {isCurrent ? (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                      Current Active
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      Historical
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isCurrent && (
                      <button
                        onClick={() => handleSetCurrent(year.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Set as Current"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(year.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Initialize Financial Year</h3>
              <p className="text-slate-400 font-medium text-sm">Define the boundaries of a new corporate calendar period.</p>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Financial Year Title</label>
                <input
                  type="text"
                  placeholder="e.g. FY 2024-2025"
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                  value={newYear.title}
                  onChange={e => setNewYear({ ...newYear, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={newYear.startDate}
                    onChange={handleStartDateChange}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={newYear.endDate}
                    onChange={e => setNewYear({ ...newYear, endDate: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <input
                  type="checkbox"
                  checked={newYear.isCurrent}
                  onChange={e => setNewYear({ ...newYear, isCurrent: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="block text-sm font-bold text-indigo-900">Set as Active Year</span>
                  <p className="text-[10px] font-medium text-indigo-400">Current active year will be archived</p>
                </div>
              </label>
            </div>
            <div className="p-10 bg-slate-50 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                Create Period
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialYearManagement;
