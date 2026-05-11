import { useGetPermissionMatrixQuery, useUpdatePermissionMatrixMutation } from "../../../features/org/permissionApi";
import { useState } from "react";

const PermissionMatrixView = () => {
  const { data: matrixData, isLoading, error } = useGetPermissionMatrixQuery();
  const [updateMatrix] = useUpdatePermissionMatrixMutation();
  const [updating, setUpdating] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-center">Loading Matrix...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading permission matrix.</div>;
  if (!matrixData) return null;

  const { roles, levels, permissions, matrix } = matrixData;

  // Define logical grouping based on user organizational structure
  const getRelevantLevelsForRole = (roleName: string) => {
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return levels.filter(l => [1, 2, 3].includes(l.levelRank));
      case 'HR':
        return levels.filter(l => [4, 7].includes(l.levelRank));
      case 'MANAGER':
        return levels.filter(l => [4, 5, 6].includes(l.levelRank)); // Including 4 as some Heads are L4
      case 'EMPLOYEE':
        return levels.filter(l => [7, 8, 9].includes(l.levelRank));
      default:
        return levels;
    }
  };

  const handleToggle = async (roleId: number, levelId: number, permissionId: number) => {
    const key = `${roleId}-${levelId}-${permissionId}`;
    setUpdating(key);

    const currentMapping = matrix.find(m => m.roleId === roleId && m.levelId === levelId);
    const currentPermissionIds = currentMapping?.permissionIds || [];
    
    let newPermissionIds: number[];
    if (currentPermissionIds.includes(permissionId)) {
      newPermissionIds = currentPermissionIds.filter(id => id !== permissionId);
    } else {
      newPermissionIds = [...currentPermissionIds, permissionId];
    }

    try {
      await updateMatrix({
        roleId,
        levelId,
        permissionIds: newPermissionIds
      }).unwrap();
    } catch (err) {
      console.error("Failed to update matrix", err);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Control Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">Configuring permissions based on Role-Level seniority mapping.</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 p-2 rounded-lg border border-gray-100">
            <span>Grid Status:</span>
            <span className="text-green-600">Synced</span>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-6 py-6 text-xs font-black uppercase tracking-widest sticky left-0 bg-gray-900 z-20 border-r border-gray-800">Permission Name</th>
              {roles.map(role => {
                  const relevantLevels = getRelevantLevelsForRole(role.roleName);
                  if (relevantLevels.length === 0) return null;
                  return (
                    <th key={role.roleId} colSpan={relevantLevels.length} className="px-4 py-3 text-center border-r border-gray-800 bg-gray-800/50">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{role.roleName} ROLE GROUP</span>
                    </th>
                  );
              })}
            </tr>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-6 py-4 sticky left-0 bg-gray-50 z-20 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]"></th>
              {roles.map(role => {
                const relevantLevels = getRelevantLevelsForRole(role.roleName);
                return relevantLevels.map(level => (
                  <th key={`${role.roleId}-${level.levelId}`} className="px-3 py-4 text-center min-w-[100px] border-r border-gray-100 last:border-r-0">
                    <div className="text-[11px] font-black text-gray-900">{level.levelCode}</div>
                    <div className="text-[9px] font-bold text-gray-400 uppercase truncate px-1" title={level.levelName}>{level.levelName}</div>
                  </th>
                ))
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {permissions.map(perm => (
              <tr key={perm.permissionId} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] group-hover:bg-blue-50/50">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">{perm.permissionName}</span>
                    <span className="text-[9px] text-gray-400 font-medium">ID: {perm.permissionId}</span>
                  </div>
                </td>
                {roles.map(role => {
                  const relevantLevels = getRelevantLevelsForRole(role.roleName);
                  return relevantLevels.map(level => {
                    const isAssigned = matrix.find(m => m.roleId === role.roleId && m.levelId === level.levelId)
                      ?.permissionIds.includes(perm.permissionId);
                    const isUpdating = updating === `${role.roleId}-${level.levelId}-${perm.permissionId}`;
                    
                    return (
                      <td key={`${role.roleId}-${level.levelId}-${perm.permissionId}`} className="px-2 py-4 text-center border-r border-gray-100 last:border-r-0">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggle(role.roleId, level.levelId, perm.permissionId)}
                          className={`w-8 h-8 rounded-xl inline-flex items-center justify-center transition-all duration-200 ${
                            isAssigned 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:scale-110' 
                              : 'bg-gray-50 text-gray-200 hover:bg-gray-100 hover:text-gray-400'
                          } ${isUpdating ? 'opacity-50 animate-pulse' : ''}`}
                        >
                          {isAssigned ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          )}
                        </button>
                      </td>
                    );
                  })
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center gap-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
              <h4 className="text-sm font-bold text-blue-900">Logical Filtering Active</h4>
              <p className="text-xs text-blue-700/70 mt-0.5">The matrix columns are filtered to only show levels relevant to each role group (e.g. Admin L1-3, HR L4/7). This prevents invalid assignments and keeps the interface clean.</p>
          </div>
      </div>
    </div>
  );
};

export default PermissionMatrixView;
