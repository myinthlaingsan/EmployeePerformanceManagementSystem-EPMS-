import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetCyclesQuery,
  useAssignBulkMutation
} from '../../features/appraisal/appraisalApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import {
  Users,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  UserPlus,
  Building2,
  Mail
} from 'lucide-react';

const AppraisalAssignment: React.FC = () => {
  const navigate = useNavigate();
  const { data: cycles = [] } = useGetCyclesQuery();
  const { data: employeePaged, isLoading: empsLoading } = useGetEmployeesQuery({ page: 0, size: 100 });
  const [assignBulk, { isLoading: isAssigning }] = useAssignBulkMutation();

  // State
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Derived Data
  const employees = employeePaged?.content || [];

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === '' || emp.currentDepartmentName === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, deptFilter]);

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.currentDepartmentName).filter(Boolean));
    return Array.from(depts);
  }, [employees]);

  // Handlers
  const toggleEmployee = (id: number) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEmployeeIds.length === filteredEmployees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(filteredEmployees.map(e => e.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedCycleId) {
      alert('Please select an appraisal cycle.');
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      alert('Please select at least one employee.');
      return;
    }

    try {
      await assignBulk({
        cycleId: Number(selectedCycleId),
        employeeIds: selectedEmployeeIds
      }).unwrap();

      alert(`Successfully assigned appraisals to ${selectedEmployeeIds.length} employees!`);
      navigate('/appraisal');
    } catch (err) {
      console.error(err);
      alert('Failed to assign appraisals. Ensure HR permissions are active.');
    }
  };

  const inputClass = "px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-700 text-sm";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Appraisal Assignment</h1>
            <p className="text-slate-400 text-xs">Link employees to a performance review cycle.</p>
          </div>
        </div>
        <button
          onClick={handleAssign}
          disabled={isAssigning || selectedEmployeeIds.length === 0}
          className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isAssigning ? 'Processing...' : <><UserPlus className="w-4 h-4" /> Confirm Assignment ({selectedEmployeeIds.length})</>}
        </button>
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Assignment Setup</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Active Cycle</label>
                <select
                  className={inputClass + " w-full"}
                  value={selectedCycleId}
                  onChange={e => setSelectedCycleId(e.target.value)}
                >
                  <option value="">Select Cycle...</option>
                  {cycles.map(c => (
                    <option key={c.cycleId} value={c.cycleId}>{c.cycleName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Search Employee</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                  <input
                    type="text"
                    placeholder="Name or email..."
                    className={inputClass + " w-full pl-10"}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">By Department</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
                  <select
                    className={inputClass + " w-full pl-10"}
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" /> Quick Summary
            </h3>
            <p className="text-indigo-100 text-xs leading-relaxed opacity-80">
              You are about to assign an appraisal to {selectedEmployeeIds.length} employees. This will notify them and their managers to begin the process.
            </p>
          </div>
        </div>

        {/* Employee List Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {filteredEmployees.length} Employees found
              </span>
              <button
                onClick={selectAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {selectedEmployeeIds.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
              {empsLoading ? (
                <div className="p-20 text-center text-slate-400">Loading directory...</div>
              ) : filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`px-8 py-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 ${selectedEmployeeIds.includes(emp.id) ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedEmployeeIds.includes(emp.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {emp.staffName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{emp.staffName}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Mail className="w-3 h-3" /> {emp.email}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 border-l border-slate-200 pl-3">
                          <Building2 className="w-3 h-3" /> {emp.currentDepartmentName || 'No Department'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedEmployeeIds.includes(emp.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200'}`}>
                    {selectedEmployeeIds.includes(emp.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </div>
              ))}

              {filteredEmployees.length === 0 && !empsLoading && (
                <div className="p-20 text-center text-slate-300">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm font-medium">No employees found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AppraisalAssignment;
