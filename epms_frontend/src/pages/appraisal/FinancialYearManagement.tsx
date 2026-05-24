import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useGetFinancialYearsQuery,
  useCreateFinancialYearMutation,
  useSetCurrentFinancialYearMutation,
  useDeleteFinancialYearMutation,
  useRolloverFinancialYearMutation
} from '../../features/appraisal/financialYearApi';
import { Plus, CheckCircle2, Trash2, History, ArrowRight, ShieldCheck } from 'lucide-react';
import { Can } from '../../components/Can';
import { format, addYears, subDays, parseISO, isValid } from 'date-fns';
import { CustomDateInput } from '../../components/common/CustomDateInput';

const inputStyle: React.CSSProperties = {
  background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
  padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
};

const FinancialYearManagement = () => {
  const { data: years, isLoading } = useGetFinancialYearsQuery();
  const [createYear] = useCreateFinancialYearMutation();
  const [setCurrent] = useSetCurrentFinancialYearMutation();
  const [deleteYear] = useDeleteFinancialYearMutation();
  const [rollover] = useRolloverFinancialYearMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newYear, setNewYear] = useState({ title: '', startDate: '', endDate: '', isCurrent: false });

  const handleStartDateChange = (startStr: string) => {
    if (!startStr) return;
    const startDate = parseISO(startStr);
    if (!isValid(startDate)) return;
    const calculatedEnd = subDays(addYears(startDate, 1), 1);
    const endStr = format(calculatedEnd, 'yyyy-MM-dd');
    const startYear = startDate.getFullYear();
    const generatedTitle = `FY ${startYear}-${startYear + 1}`;
    setNewYear({ ...newYear, startDate: startStr, endDate: endStr, title: newYear.title === '' || newYear.title.startsWith('FY ') ? generatedTitle : newYear.title });
  };

  const handleAdd = async () => {
    if (!newYear.title || !newYear.startDate || !newYear.endDate) { toast.warning('Please fill all required fields'); return; }
    const start = parseISO(newYear.startDate);
    const end = parseISO(newYear.endDate);
    if (end < addYears(start, 1) && format(end, 'yyyy-MM-dd') !== format(subDays(addYears(start, 1), 1), 'yyyy-MM-dd')) {
      if (!window.confirm('The period is less than one year. Proceed?')) return;
    }
    try {
      await createYear(newYear).unwrap();
      setShowAddModal(false);
      setNewYear({ title: '', startDate: '', endDate: '', isCurrent: false });
    } catch { toast.error('Failed to create financial year'); }
  };

  const handleSetCurrent = async (id: number) => {
    if (window.confirm('Set this as the current Financial Year? All others will be deactivated.')) await setCurrent(id);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this financial year?')) await deleteYear(id);
  };

  const handleRollover = async () => {
    if (window.confirm('Execute Rollover? This validates active appraisals, creates the next FY, and archives the current one.')) {
      try { await rollover().unwrap(); }
      catch (err: any) { toast.error(err?.data?.message || 'Rollover failed.'); }
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Financial Year Configuration</h1>
          <p style={{ fontSize: 13, color: '#9EA3B0', marginTop: 2 }}>Manage corporate periods and active appraisal timelines.</p>
        </div>
        <Can permission="CYCLE_CONFIG_MANAGE">
          <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
            style={{ background: '#1A56DB', color: '#FFFFFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, border: 'none' }}>
            <Plus size={14} /> Initialize New FY
          </button>
        </Can>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <History size={16} style={{ color: '#1A56DB' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Periods</p>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>{years?.length || 0}</p>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={16} style={{ color: '#27500A' }} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Status</p>
            <p style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>{years?.filter(y => y.isCurrent || (y as any).current).length || 0} Period Live</p>
          </div>
        </div>
        <Can permission="CYCLE_CONFIG_MANAGE">
          <div onClick={handleRollover} style={{ background: '#111827', border: 'none', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            className="hover:opacity-90 transition-opacity">
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Phase</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF', marginTop: 2 }}>Execute Rollover</p>
            </div>
            <ArrowRight size={18} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </Can>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 520 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E4E6EC' }}>
                {['Financial Year', 'Start Date', 'End Date', 'Status', ''].map((h, i) => (
                  <th key={h + i} style={{ padding: '10px 18px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: i === 4 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading…</td></tr>
              ) : years?.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No financial years configured.</td></tr>
              ) : years?.map((year, idx) => {
                const isCurrent = year.isCurrent || (year as any).current;
                return (
                  <tr key={year.id} style={{ borderBottom: idx < (years.length - 1) ? '0.5px solid #F0F2F6' : 'none' }}
                    className="hover:bg-[#FAFBFF] transition-colors">
                    <td style={{ padding: '11px 18px' }}>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isCurrent ? '#1A56DB' : '#E4E6EC', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{year.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#5A6070' }}>{format(new Date(year.startDate), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#5A6070' }}>{format(new Date(year.endDate), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '11px 18px' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, background: isCurrent ? '#EEF3FD' : '#F1EFE8', color: isCurrent ? '#0C447C' : '#444441', border: `0.5px solid ${isCurrent ? '#B5D4F4' : '#DDDBD2'}`, borderRadius: 20, padding: '2px 8px' }}>
                        {isCurrent ? 'Current Active' : 'Historical'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 18px', textAlign: 'right' }}>
                      <Can permission="CYCLE_CONFIG_MANAGE">
                        <div className="flex justify-end items-center gap-1">
                          {!isCurrent && (
                            <button onClick={() => handleSetCurrent(year.id)} title="Set as Current"
                              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9EA3B0', borderRadius: 6 }}
                              className="hover:bg-[#EEF3FD] hover:text-[#1A56DB] transition-colors">
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(year.id)} title="Delete"
                            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9EA3B0', borderRadius: 6 }}
                            className="hover:bg-[#FCEBEB] hover:text-[#791F1F] transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </Can>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(17,24,39,0.5)' }}>
          <div onClick={() => setShowAddModal(false)} className="absolute inset-0" />
          <div style={{ position: 'relative', background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '16px 18px', borderBottom: '0.5px solid #E4E6EC' }}>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: '#111827', marginBottom: 4 }}>Initialize Financial Year</h3>
              <p style={{ fontSize: 12, color: '#9EA3B0' }}>Define a new corporate calendar period.</p>
            </div>
            <div style={{ padding: '16px 18px' }} className="space-y-4">
              <div>
                <label style={labelStyle}>Financial Year Title</label>
                <input type="text" placeholder="e.g. FY 2024-2025" style={inputStyle}
                  value={newYear.title} onChange={e => setNewYear({ ...newYear, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <CustomDateInput style={inputStyle} value={newYear.startDate} onChange={handleStartDateChange} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <CustomDateInput style={inputStyle} value={newYear.endDate} onChange={val => setNewYear({ ...newYear, endDate: val })} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer" style={{ background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '10px 12px' }}>
                <input type="checkbox" checked={newYear.isCurrent} onChange={e => setNewYear({ ...newYear, isCurrent: e.target.checked })}
                  style={{ accentColor: '#1A56DB' }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0C447C', display: 'block' }}>Set as Active Year</span>
                  <span style={{ fontSize: 11, color: '#5A6070' }}>Current active year will be archived</span>
                </div>
              </label>
            </div>
            <div className="flex gap-2" style={{ padding: '14px 18px', borderTop: '0.5px solid #E4E6EC' }}>
              <button onClick={() => setShowAddModal(false)} className="flex-1 transition-colors"
                style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 500 }}>
                Cancel
              </button>
              <button onClick={handleAdd} className="flex-[2] transition-colors"
                style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 500 }}>
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
