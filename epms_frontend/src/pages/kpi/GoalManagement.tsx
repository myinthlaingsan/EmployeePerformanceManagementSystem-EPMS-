import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { useGetCyclesQuery } from '../../features/appraisal/appraisalApi';
import { useAuth } from '../../hooks/useAuth';
import {
  RefreshCw,
  ClipboardList,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import BulkAssignModal from '../../components/kpi/BulkAssignModal';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { useGetDepartmentGoalSetsQuery, useGetTeamGoalSetsQuery } from '../../services/kpiApi';

const GoalManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isManager, isHR } = useAuth();
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const isAdminOrHr = isAdmin || isHR;

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Data Fetching
  const { data: pagedData, isLoading: loadingEmployees } = useGetEmployeesQuery({ page, size });
  const employees = pagedData?.content || [];

  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: positions = [] } = useGetPositionsQuery();
  const { data: cyclesResponse } = useGetCyclesQuery();
  const cycles = Array.isArray(cyclesResponse) ? cyclesResponse : ((cyclesResponse as any)?.data || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [selectedCycle, setSelectedCycle] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // KPI Status Fetching - Adaptive based on role
  const { activeCycleId, activeCycleName } = useAuth();
  const effectiveCycleId = selectedCycle === 'All' ? activeCycleId : Number(selectedCycle);

  // Fetch statuses based on permission level
  const { data: deptGoalSetsResponse } = useGetDepartmentGoalSetsQuery(
    { cycleId: effectiveCycleId! },
    { skip: !effectiveCycleId || !isAdminOrHr }
  );

  const { data: teamGoalSetsResponse } = useGetTeamGoalSetsQuery(
    { managerId: Number(user?.id), cycleId: effectiveCycleId! },
    { skip: !effectiveCycleId || isAdminOrHr || !user?.id }
  );

  const goalSets = isAdminOrHr ? (deptGoalSetsResponse?.data || []) : (teamGoalSetsResponse?.data || []);
  const goalStatusMap = new Map<number, string>(goalSets.map(gs => [gs.employeeId, gs.status]));

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return (
      <div className="flex items-center gap-1.5 opacity-60">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400">
          <XCircle className="w-3.5 h-3.5" />
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Not Assigned</span>
      </div>
    );

    switch (status) {
      case 'DRAFT':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600">
              <ClipboardList className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Drafting</span>
          </div>
        );

      case 'APPROVED':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Approved</span>
          </div>
        );
      case 'LOCKED':
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Locked (Active)</span>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{status}</span>
          </div>
        );
    }
  };

  const filteredEmployees = employees.filter(emp => {
    // Exclude current user unless admin
    if (!isAdmin && emp.id === user?.id) return false;

    const matchesSearch = emp.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment === 'All' ||
      emp.currentDepartmentName === selectedDepartment ||
      emp.parentDepartmentName === selectedDepartment;

    const matchesPosition = selectedPosition === 'All' ||
      emp.positionName === selectedPosition;

    return matchesSearch && matchesDept && matchesPosition;
  });

  // Server-side paging is already happening, so we don't need additional client-side slicing
  // unless we are filtering locally on the paged results. 
  // For a better experience with large datasets, server-side filtering should be implemented.
  const currentEmployees = filteredEmployees;
  const totalElements = pagedData?.totalElements || 0;
  const totalPages = pagedData?.totalPages || 0;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(currentEmployees.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="max-w-[1440px] mx-auto px-8 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization-wide Goal Assignment</h1>
            <p className="text-sm text-slate-500 font-medium max-w-2xl">
              Manage and track performance cycle milestones across all departments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (selectedIds.length === 0) {
                  alert('Please select at least one employee');
                  return;
                }
                setIsBulkModalOpen(true);
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-2 ${selectedIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white border border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              <ClipboardList className="w-4 h-4" />
              Bulk Assign Templates {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>


          </div>
        </div>

        {/* Main Grid Setup - Now taking full width since widgets are removed */}
        <div className="grid grid-cols-1 gap-6">

          <div className="space-y-4">

            {/* Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees by name or emp code..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#0052CC]/20 outline-none transition-all"
                  value={searchTerm || ''}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="py-2 pl-4 pr-8 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="All">Department: All</option>
                {departments.map((dept, idx) => (
                  <option key={`${dept.id}-${idx}`} value={dept.departmentName}>{dept.departmentName}</option>
                ))}
              </select>
              <select
                className="py-2 pl-4 pr-8 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                <option value="All">Position: All</option>
                {positions.map((pos, idx) => (
                  <option key={`${pos.positionId}-${idx}`} value={pos.positionName}>{pos.positionName}</option>
                ))}
              </select>
              <select
                className="py-2 pl-4 pr-8 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
              >
                <option value="All">Cycle: All</option>
                {cycles.map((cycle, idx) => (
                  <option key={`${cycle.id}-${idx}`} value={cycle.id}>{cycle.name}</option>
                ))}
              </select>

              <button className="p-2.5 bg-slate-50 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-blue-50 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-6 py-4 w-10">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-200 text-[#0052CC] focus:ring-[#0052CC]/20 cursor-pointer"
                          checked={selectedIds.length === currentEmployees.length && currentEmployees.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Position</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingEmployees && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                          Loading employees...
                        </td>
                      </tr>
                    )}
                    {!loadingEmployees && currentEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        onClick={() => {
                          const status = goalStatusMap.get(emp.id);
                          if (status === 'APPROVED' || status === 'LOCKED') {
                            navigate(`/kpi/goals/${emp.id}`);
                          } else {
                            navigate(`/kpi/assign/${emp.id}`);
                          }
                        }}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${selectedIds.includes(emp.id) ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-200 text-[#0052CC] focus:ring-[#0052CC]/20 cursor-pointer"
                            checked={selectedIds.includes(emp.id)}
                            onChange={() => handleToggleSelect(emp.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold">
                              {emp.staffName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 group-hover:text-[#0052CC] transition-colors">{emp.staffName}</div>
                              <div className="text-[10px] font-medium text-slate-400">{emp.email || `${emp.staffName.split(' ')[0].toLowerCase()}@enterprise.com`}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">
                          {emp.currentDepartmentName || emp.parentDepartmentName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-semibold text-slate-600 whitespace-normal max-w-[120px] leading-tight">
                            {emp.positionName || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(goalStatusMap.get(emp.id))}
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && !loadingEmployees && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                          No employees found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Showing <strong className="text-slate-900">{totalElements > 0 ? (page * size) + 1 : 0}-{Math.min((page + 1) * size, totalElements)}</strong> of <strong className="text-slate-900">{totalElements}</strong> employees
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
                    disabled={page >= totalPages - 1 || totalPages === 0}
                    className="px-3 py-1.5 bg-[#0052CC] text-white text-[10px] font-bold rounded-lg hover:bg-[#0747A6] shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {isBulkModalOpen && (
          <BulkAssignModal
            selectedEmployeeIds={selectedIds}
            onClose={() => setIsBulkModalOpen(false)}
            onSuccess={() => {
              setIsBulkModalOpen(false);
              setSelectedIds([]);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GoalManagement;
