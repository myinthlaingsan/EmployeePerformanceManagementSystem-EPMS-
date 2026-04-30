import React, { useState } from 'react';
import { useGetDepartmentsQuery } from '../features/org/departmentApi';
import { useGetEmployeesQuery } from '../features/employee/employeeapi';
import { useGetPerformanceHistoryByEmployeeQuery } from '../features/continuous/continuousApi';
import { format } from 'date-fns';

export const PerformanceHistoryPage = () => {
  const { data: departments, isLoading: isDeptsLoading } = useGetDepartmentsQuery();
  const { data: employees, isLoading: isEmpsLoading } = useGetEmployeesQuery();

  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');

  const { data: history, isLoading: isHistoryLoading } = useGetPerformanceHistoryByEmployeeQuery(
    Number(selectedEmpId), 
    { skip: !selectedEmpId }
  );

  const filteredEmployees = employees?.filter(emp => 
    selectedDeptId ? emp.currentDepartmentId === selectedDeptId : false
  ) || [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Performance History Tracker</h1>
        <p className="text-gray-500">View chronological performance activities, feedback, and 1-on-1 meeting records for employees.</p>
      </header>

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
      </div>

      {/* History Timeline Section */}
      {selectedEmpId ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-8">Performance Timeline</h2>
          
          {isHistoryLoading ? (
            <div className="text-center py-10 text-gray-400 font-medium">Loading history...</div>
          ) : history && history.length > 0 ? (
            <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
              {history.map((record) => (
                <div key={record.historyId} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${
                    record.sourceType === 'FEEDBACK' ? 'bg-emerald-400' : 'bg-blue-400'
                  } group-hover:scale-125 transition-transform`} />
                  
                  <div className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            record.sourceType === 'FEEDBACK' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {record.sourceType}
                          </span>
                          {record.isPrivate && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                              Private
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          {record.title}
                          {record.employeeId !== Number(selectedEmpId) ? (
                            <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                              for {record.employeeName}
                            </span>
                          ) : (
                            <span className="text-sm font-normal text-gray-400 bg-indigo-50 px-2 py-0.5 rounded-lg">
                              by {record.managerName}
                            </span>
                          )}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full shadow-sm">
                        {record.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy • p') : ''}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {record.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 font-medium">No performance history recorded for this employee yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-100">
          <p className="text-indigo-400 font-medium">Select an employee to view their performance history.</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceHistoryPage;
