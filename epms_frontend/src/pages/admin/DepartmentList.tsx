import { useGetDepartmentsQuery, useCreateDepartmentMutation, useDeleteDepartmentMutation } from "../../features/org/departmentApi";
import { useState } from "react";

const DepartmentList = () => {
  const { data: departments, isLoading, error } = useGetDepartmentsQuery();
  const [createDepartment] = useCreateDepartmentMutation();
  const [deleteDepartment] = useDeleteDepartmentMutation();
  
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;
    try {
      await createDepartment({ 
        departmentName: newDeptName,
        departmentCode: newDeptCode
      }).unwrap();
      setNewDeptName("");
      setNewDeptCode("");
    } catch (err) {
      console.error("Failed to create department", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading departments...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading departments.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
      </div>

      {/* Create Form */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Department Code (e.g. IT)"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newDeptCode}
            onChange={(e) => setNewDeptCode(e.target.value)}
          />
          <input
            type="text"
            placeholder="Department Name"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Add Department
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {departments?.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-mono text-blue-600">{dept.departmentCode}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.departmentName}</td>
                <td className="px-6 py-4 text-sm text-right space-x-2">
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentList;
