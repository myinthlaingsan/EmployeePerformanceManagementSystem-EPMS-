import { useGetRolesQuery, useCreateRoleMutation, useDeleteRoleMutation } from "../../features/org/roleApi";
import { useState } from "react";

const RoleList = () => {
  const { data: roles, isLoading, error } = useGetRolesQuery();
  const [createRole] = useCreateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();
  const [newRoleName, setNewRoleName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    try {
      // Assuming roleName is "ADMIN", "HR", etc. as per backend Enum
      await createRole({ roleName: newRoleName.toUpperCase() as any }).unwrap();
      setNewRoleName("");
    } catch (err) {
      console.error("Failed to create role", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading roles...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading roles.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleCreate} className="flex gap-4">
          <select
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          >
            <option value="">Select Role Type</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="MANAGER">MANAGER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Add Role
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles?.map((role) => (
              <tr key={role.roleId} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-600">{role.roleId}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                    role.roleName === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    role.roleName === 'HR' ? 'bg-blue-100 text-blue-700' :
                    role.roleName === 'MANAGER' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {role.roleName}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <button
                    onClick={() => deleteRole(role.roleId)}
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

export default RoleList;
