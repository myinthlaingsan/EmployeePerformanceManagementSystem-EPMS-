import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  ChevronRight
} from 'lucide-react';
import { useGetAllEmployeesQuery, useGetDirectReportsQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import { useActiveCycle } from '../../context/ActiveCycleContext';
import { useGetTeamGoalSetsQuery } from '../../services/kpiApi';
import BulkAssignModal from '../../components/kpi/BulkAssignModal';

const TeamKpiDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrHr = user?.roles?.some(r => r === 'ADMIN' || r === 'HR');

  // Conditional data fetching: Admins see everyone, Managers see direct reports
  const { data: allEmployees = [], isLoading: loadingAll } = useGetAllEmployeesQuery(undefined, { skip: !isAdminOrHr });
  const { data: directReports = [], isLoading: loadingReports } = useGetDirectReportsQuery(Number(user?.id), { skip: isAdminOrHr || !user?.id });
  
  const employees = isAdminOrHr ? allEmployees : directReports;
  const isLoading = isAdminOrHr ? loadingAll : loadingReports;

  const { activeCycleId, activeCycleName } = useActiveCycle();

  const { data: teamGoalsResponse } = useGetTeamGoalSetsQuery({
    managerId: Number(user?.id),
    cycleId: Number(activeCycleId)
  }, { skip: !user?.id || !activeCycleId });

  const teamGoals = teamGoalsResponse?.data || [];

  // State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'progress-high' | 'progress-low'>('name');

  const teamMembers = useMemo(() => {
    if (!user || !employees) return [];
    
    let members = employees.map(emp => {
      const goals = teamGoals.find(g => g.employeeId === emp.id);
      const items = goals?.items || [];
      let progress = 0;
      if (items.length > 0) {
        const totalWeight = items.reduce((acc, i) => acc + (i.weightPercent || 0), 0);
        if (totalWeight > 0) {
          const weightedSum = items.reduce((acc, i) => {
            const p = Math.min(Math.floor(((i as any).currentProgress || 0) / ((i as any).targetValue || 1) * 100), 100);
            return acc + (p * (i.weightPercent || 0));
          }, 0);
          progress = Math.floor(weightedSum / totalWeight);
        }
      }
      return {
        ...emp,
        goalSet: goals,
        progress
      };
    });

    // Filter
    if (searchTerm) {
      members = members.filter(m => 
        m.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    return [...members].sort((a, b) => {
      if (sortBy === 'name') return a.staffName.localeCompare(b.staffName);
      if (sortBy === 'progress-high') return b.progress - a.progress;
      if (sortBy === 'progress-low') return a.progress - b.progress;
      return 0;
    });
  }, [employees, user, teamGoals, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const totalReports = teamMembers.length;
    const withGoals = teamMembers.filter(m => m.goalSet).length;
    
    return {
      overallCompletion: totalReports > 0 ? Math.round((withGoals / totalReports) * 100) : 0,
      onTrack: withGoals,
      atRisk: totalReports - withGoals,
      targetDate: 'Active',
      phase: 'Goal Setting'
    };
  }, [teamMembers]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(teamMembers.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-8 max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Team Performance</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" />
              Direct Reports & Goal Tracking • {activeCycleName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search reports..."
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-900 text-xs font-black rounded-xl hover:bg-gray-50 transition-all shadow-sm uppercase tracking-widest">
              <Download className="w-4 h-4" />
              Report
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal Assignment</p>
              <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                <TrendingUp className="w-3 h-3" />
                Coverage
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="text-5xl font-black text-gray-900">{stats.overallCompletion}%</h3>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-4">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${stats.overallCompletion}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Phase: {stats.phase}</span>
              <span>{stats.onTrack} of {teamMembers.length} Employees</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Assigned</p>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-black text-gray-900">{stats.onTrack}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Active Goal Sets</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">Pending</p>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-red-600">{stats.atRisk}</p>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Reports</p>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Requires assignment</p>
            </div>
          </div>
        </div>

        {/* Goals Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Direct Reports Tracking</h3>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
                <select 
                  className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 outline-none appearance-none cursor-pointer hover:border-blue-200 transition-all shadow-sm uppercase tracking-widest"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="progress-high">Sort: High Progress</option>
                  <option value="progress-low">Sort: Low Progress</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
                </div>
              </div>
              {selectedIds.length > 0 && (
                <button 
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-widest active:scale-95 animate-in slide-in-from-right-4"
                >
                  Bulk Assign ({selectedIds.length})
                </button>
              )}
              <button 
                onClick={() => navigate('/kpi/manage')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-[10px] font-black hover:bg-black transition-all shadow-md uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-3 h-3" />
                Assign Goal
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.length === teamMembers.length && teamMembers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Direct Report</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">KPI Items</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cycle</th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamMembers.map((emp) => (
                  <tr 
                    key={emp.id} 
                    className={`hover:bg-blue-50/10 transition-colors group cursor-pointer ${selectedIds.includes(emp.id) ? 'bg-blue-50/20' : ''}`} 
                  >
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                       <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.includes(emp.id)}
                        onChange={() => handleToggleSelect(emp.id)}
                      />
                    </td>
                    <td className="px-8 py-5" onClick={() => navigate(`/kpi/assign/${emp.id}`)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm">
                          {emp.staffName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm tracking-tight">{emp.staffName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.positionName || 'Associate'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        emp.goalSet?.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                        emp.goalSet?.status === 'LOCKED' ? 'bg-gray-900 text-white' :
                        emp.goalSet?.status === 'SUBMITTED' ? 'bg-yellow-50 text-yellow-600' :
                        emp.goalSet?.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                        emp.goalSet?.status === 'DRAFT' ? 'bg-blue-50 text-blue-600' :
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {emp.goalSet?.status || 'Not Assigned'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-gray-600">
                        {emp.goalSet?.items?.length || 0} Items
                      </p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {emp.goalSet?.appraisalCycleName || activeCycleName}
                       </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-700 ${
                                emp.progress >= 80 ? 'bg-emerald-500' :
                                emp.progress >= 40 ? 'bg-blue-600' :
                                emp.progress > 0 ? 'bg-amber-500' : 'bg-gray-200'
                              }`}
                              style={{ width: `${emp.progress}%` }} 
                            ></div>
                         </div>
                         <span className={`text-[10px] font-black ${
                           emp.progress >= 80 ? 'text-emerald-600' :
                           emp.progress >= 40 ? 'text-blue-600' :
                           emp.progress > 0 ? 'text-amber-600' : 'text-gray-400'
                         }`}>{emp.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-blue-600 group-hover:translate-x-1 transition-all duration-300">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Manage</span>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default TeamKpiDashboard;
