import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useAuth } from '../../hooks/useAuth';
import { Search, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import BulkAssignModal from '../../components/kpi/BulkAssignModal';
import { useGetDepartmentGoalSetsQuery, useGetTeamGoalSetsQuery } from '../../services/kpiApi';
import React from 'react';

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  DRAFT:    { bg: '#EEF3FD', text: '#0C447C', border: '#B5D4F4', label: 'Drafting' },
  APPROVED: { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0', label: 'Approved' },
  LOCKED:   { bg: '#F1EFE8', text: '#444441', border: '#DDDBD2', label: 'Locked (Active)' },
};

const GoalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isHR, activeCycleId } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const isAdminOrHr = isAdmin || isHR;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const { data: pagedData, isLoading: loadingEmployees } = useGetEmployeesQuery({ page, size });
  const employees = pagedData?.content || [];
  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: cyclesResponse } = useGetCyclesQuery();
  const cycles = Array.isArray(cyclesResponse) ? cyclesResponse : ((cyclesResponse as any)?.data || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [selectedCycle, setSelectedCycle] = useState('All');

  const effectiveCycleId = selectedCycle === 'All' ? activeCycleId : Number(selectedCycle);

  const { data: deptGoalSetsResponse } = useGetDepartmentGoalSetsQuery(
    { cycleId: effectiveCycleId! }, { skip: !effectiveCycleId || !isAdminOrHr }
  );
  const { data: teamGoalSetsResponse } = useGetTeamGoalSetsQuery(
    { managerId: Number(user?.id), cycleId: effectiveCycleId! },
    { skip: !effectiveCycleId || isAdminOrHr || !user?.id }
  );
  const goalSets = isAdminOrHr ? (deptGoalSetsResponse?.data || []) : (teamGoalSetsResponse?.data || []);
  const goalStatusMap = new Map<number, string>(goalSets.map(gs => [gs.employeeId, gs.status]));

  const filteredEmployees = employees.filter(emp => {
    if (!isAdmin && emp.id === user?.id) return false;
    const matchesSearch = emp.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === 'All' || emp.currentDepartmentName === selectedDepartment || emp.parentDepartmentName === selectedDepartment;
    const matchesPos = selectedPosition === 'All' || emp.positionName === selectedPosition;
    return matchesSearch && matchesDept && matchesPos;
  });

  const totalElements = pagedData?.totalElements || 0;
  const totalPages = pagedData?.totalPages || 0;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? filteredEmployees.map(m => m.id) : []);
  };

  const selectStyle: React.CSSProperties = {
    background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
    padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', appearance: 'none' as any,
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Organization-wide Goal Assignment</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Manage and track performance cycle milestones across all departments.</p>
        </div>
        <button
          onClick={() => { if (selectedIds.length === 0) { toast.warning('Select at least one employee'); return; } setIsBulkModalOpen(true); }}
          className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
          style={{
            background: selectedIds.length > 0 ? '#1A56DB' : '#F5F6F8',
            color: selectedIds.length > 0 ? '#FFFFFF' : '#9EA3B0',
            border: `0.5px solid ${selectedIds.length > 0 ? '#1A56DB' : '#E0E2E8'}`,
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500,
            cursor: selectedIds.length > 0 ? 'pointer' : 'default',
          }}>
          <ClipboardList size={14} />
          Bulk Assign Templates {selectedIds.length > 0 && `(${selectedIds.length})`}
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '12px 14px' }}
        className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
          <input type="text" placeholder="Search by name or employee code…"
            style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 13, color: '#111827', outline: 'none', width: '100%' }}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select style={selectStyle} value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)}>
          <option value="All">Dept: All</option>
          {departments.map((d, i) => <option key={`${d.id}-${i}`} value={d.departmentName}>{d.departmentName}</option>)}
        </select>
        <select style={selectStyle} value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)}>
          <option value="All">Position: All</option>
          {positions.map((p, i) => <option key={`${p.positionId}-${i}`} value={p.positionName}>{p.positionName}</option>)}
        </select>
        <select style={selectStyle} value={selectedCycle} onChange={e => setSelectedCycle(e.target.value)}>
          <option value="All">Cycle: All</option>
          {cycles.map((c, i) => <option key={`${c.id}-${i}`} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E4E6EC', background: '#FAFBFF' }}>
                <th style={{ padding: '10px 16px', width: 40 }}>
                  <input type="checkbox" style={{ accentColor: '#1A56DB' }}
                    checked={selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={handleSelectAll} />
                </th>
                {['Employee','Department','Position','Goal Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingEmployees && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading employees…</td></tr>
              )}
              {!loadingEmployees && filteredEmployees.map((emp, idx) => {
                const status = goalStatusMap.get(emp.id);
                const ss = status ? STATUS_STYLE[status] : null;
                return (
                  <tr key={emp.id}
                    style={{ borderBottom: idx < filteredEmployees.length - 1 ? '0.5px solid #F0F2F6' : 'none', background: selectedIds.includes(emp.id) ? '#EEF3FD' : '#FFFFFF', cursor: 'pointer' }}
                    className="hover:bg-[#FAFBFF] transition-colors"
                    onClick={() => {
                      if (status === 'APPROVED' || status === 'LOCKED') navigate(`/kpi/goals/${emp.id}`);
                      else navigate(`/kpi/assign/${emp.id}`);
                    }}>
                    <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                      <input type="checkbox" style={{ accentColor: '#1A56DB' }}
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(emp.id) ? prev.filter(i => i !== emp.id) : [...prev, emp.id])} />
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF3FD', color: '#1A56DB', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {emp.staffName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{emp.staffName}</p>
                          <p style={{ fontSize: 11, color: '#9EA3B0' }}>{emp.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#5A6070' }}>{emp.currentDepartmentName || emp.parentDepartmentName || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#5A6070' }}>{emp.positionName || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {ss ? (
                        <span style={{ fontSize: 10, fontWeight: 500, background: ss.bg, color: ss.text, border: `0.5px solid ${ss.border}`, borderRadius: 20, padding: '2px 8px' }}>
                          {ss.label}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle size={13} style={{ color: '#9EA3B0' }} />
                          <span style={{ fontSize: 10, color: '#9EA3B0' }}>Not Assigned</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredEmployees.length === 0 && !loadingEmployees && (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No employees found matching criteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3"
          style={{ padding: '10px 16px', borderTop: '0.5px solid #E4E6EC', background: '#FAFBFF' }}>
          <span style={{ fontSize: 12, color: '#9EA3B0' }}>
            Showing <strong style={{ color: '#111827' }}>{totalElements > 0 ? page * size + 1 : 0}–{Math.min((page + 1) * size, totalElements)}</strong> of <strong style={{ color: '#111827' }}>{totalElements}</strong>
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}
              style={{ background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500 }}
              className="disabled:opacity-50 transition-colors hover:bg-[#E0E2E8]">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))} disabled={page >= totalPages - 1 || totalPages === 0}
              style={{ background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 500 }}
              className="disabled:opacity-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {isBulkModalOpen && (
        <BulkAssignModal selectedEmployeeIds={selectedIds}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => { setIsBulkModalOpen(false); setSelectedIds([]); }} />
      )}

      <div style={{ display: 'none' }}><CheckCircle2 /></div>
    </div>
  );
};

export default GoalManagement;
