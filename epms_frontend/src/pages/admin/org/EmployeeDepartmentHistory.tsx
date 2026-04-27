import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetEmployeeDepartmentHistoryQuery, useAssignDepartmentMutation } from "../../../features/org/employeeDepartmentApi";
import { useGetEmployeeByIdQuery } from "../../../features/employee/employeeapi";
import { useGetDepartmentsQuery } from "../../../features/org/departmentApi";

const EmployeeDepartmentHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const employeeId = Number(id);

  const { data: employee } = useGetEmployeeByIdQuery(employeeId);
  const { data: history, isLoading } = useGetEmployeeDepartmentHistoryQuery(employeeId);
  const { data: departments } = useGetDepartmentsQuery();
  const [assignDepartment, { isLoading: isAssigning }] = useAssignDepartmentMutation();

  const [formData, setFormData] = useState({
    currentDepartmentId: 0,
    parentDepartmentId: 0,
  });

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignDepartment({
        employeeId,
        currentDepartmentId: formData.currentDepartmentId,
        parentDepartmentId: formData.parentDepartmentId || undefined,
      }).unwrap();
      setFormData({ currentDepartmentId: 0, parentDepartmentId: 0 });
      alert("Department assigned successfully!");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to assign department");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/employees")} className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1">
            &larr; Back to Employees
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Department History: {employee?.staffName}</h1>
          <p className="text-gray-500 mt-1">Manage and view department assignments and transfers over time.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Assignment Form */}
        <div className="lg:col-span-1">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Assign Department</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Current Department (ERP) *</label>
                <select required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.currentDepartmentId} onChange={e => setFormData({ ...formData, currentDepartmentId: Number(e.target.value) })}>
                  <option value={0}>Select Current Dept</option>
                  {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parent Department (Banking)</label>
                <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.parentDepartmentId} onChange={e => setFormData({ ...formData, parentDepartmentId: Number(e.target.value) })}>
                  <option value={0}>Select Parent Dept</option>
                  {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={isAssigning || formData.currentDepartmentId === 0}
                className="w-full py-3 mt-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isAssigning ? "Assigning..." : "Assign Department"}
              </button>
            </form>
          </section>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Assignment History</h2>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((record, index) => (
                  <div key={record.id} className={`p-4 rounded-2xl border ${record.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold ${record.isCurrent ? 'text-blue-900' : 'text-gray-700'}`}>
                            {record.currentDepartmentName}
                          </h3>
                          {record.isCurrent && (
                            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
                          )}
                        </div>
                        {record.parentDepartmentName && (
                          <p className="text-sm text-gray-500 mt-1">Parent: {record.parentDepartmentName}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-mono">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No department history found.</p>
            )}
          </section>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDepartmentHistory;
