import { useState } from "react";
import { 
  useGetPermissionsQuery, 
  useCreatePermissionMutation, 
  useUpdatePermissionMutation, 
  useDeletePermissionMutation 
} from "../../features/org/permissionApi";

const PermissionList = () => {
  const { data: permissions, isLoading, error } = useGetPermissionsQuery();
  const [createPermission] = useCreatePermissionMutation();
  const [updatePermission] = useUpdatePermissionMutation();
  const [deletePermission] = useDeletePermissionMutation();

  const [newPermissionName, setNewPermissionName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermissionName.trim()) return;
    try {
      await createPermission({ permissionName: newPermissionName.toUpperCase() }).unwrap();
      setNewPermissionName("");
    } catch (err) {
      console.error("Failed to create permission", err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updatePermission({ id, body: { permissionName: editName.toUpperCase() } }).unwrap();
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update permission", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this permission?")) {
      try {
        await deletePermission(id).unwrap();
      } catch (err) {
        console.error("Failed to delete permission", err);
        alert("Cannot delete permission. It might be assigned to roles/levels.");
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading permissions...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">Error loading permissions.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
          <p className="text-sm text-gray-500 mt-1">Define granular system permissions that can be assigned to roles and levels.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Create New Permission</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="e.g. MANAGE_USERS"
            className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition uppercase"
            value={newPermissionName}
            onChange={(e) => setNewPermissionName(e.target.value)}
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg shadow-gray-200"
          >
            Add Permission
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Permission Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permissions?.map((perm) => (
              <tr key={perm.permissionId} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{perm.permissionId}</td>
                <td className="px-6 py-4">
                  {editingId === perm.permissionId ? (
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold text-blue-600"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleUpdate(perm.permissionId)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(perm.permissionId)}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-bold text-gray-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                      {perm.permissionName}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex justify-end items-center gap-3">
                    <button
                      onClick={() => {
                        setEditingId(perm.permissionId);
                        setEditName(perm.permissionName);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(perm.permissionId)}
                      className="text-red-500 hover:text-red-700 font-bold transition"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionList;
