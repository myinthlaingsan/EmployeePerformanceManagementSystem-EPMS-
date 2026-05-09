import { useState} from "react";
import { useGetRolesQuery } from "../../../features/org/roleApi";
import { useGetJobLevelsQuery } from "../../../features/org/jobLevelApi";
import { 
  useGetPermissionsQuery, 
  useGetAssignedPermissionsQuery, 
  useUpdatePermissionMatrixMutation
} from "../../../features/org/permissionApi";

const RoleLevelPermissionManager = () => {
  const { data: roles } = useGetRolesQuery();
  const { data: levels } = useGetJobLevelsQuery();
  const { data: allPermissions } = useGetPermissionsQuery();

  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(0);

  // Skip query if IDs are 0
  const { data: assignments, isLoading: loadingAssignments } = useGetAssignedPermissionsQuery(
    { roleId: selectedRoleId, levelId: selectedLevelId },
    { skip: selectedRoleId === 0 || selectedLevelId === 0 }
  );

  const [updateMatrix] = useUpdatePermissionMatrixMutation();
  
  // Define logical grouping (matching the Matrix view)
  const getRelevantLevelsForRole = (roleName: string | undefined) => {
    if (!roleName || !levels) return [];
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return levels.filter(l => [1, 2, 3].includes(l.levelRank));
      case 'HR':
        return levels.filter(l => [4, 7].includes(l.levelRank));
      case 'MANAGER':
        return levels.filter(l => [4, 5, 6].includes(l.levelRank));
      case 'EMPLOYEE':
        return levels.filter(l => [7, 8, 9].includes(l.levelRank));
      default:
        return levels;
    }
  };

  const selectedRoleName = roles?.find(r => r.roleId === selectedRoleId)?.roleName;
  const filteredLevels = getRelevantLevelsForRole(selectedRoleName);

  const handleRoleChange = (roleId: number) => {
    setSelectedRoleId(roleId);
    setSelectedLevelId(0); // Reset level when role changes
  };

  const handleTogglePermission = async (permissionId: number) => {
    if (selectedRoleId === 0 || selectedLevelId === 0) return;

    const currentPermissionIds = assignments?.map(a => a.permissionId) || [];
    let newPermissionIds: number[];

    if (currentPermissionIds.includes(permissionId)) {
      newPermissionIds = currentPermissionIds.filter(id => id !== permissionId);
    } else {
      newPermissionIds = [...currentPermissionIds, permissionId];
    }

    try {
      await updateMatrix({
        roleId: selectedRoleId,
        levelId: selectedLevelId,
        permissionIds: newPermissionIds
      }).unwrap();
    } catch (err) {
      console.error("Failed to update permissions", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Assign Permissions</h1>
        <p className="text-gray-500 mt-2 text-lg">Select a role and its valid seniority levels to manage access.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">1. Select Target Role</label>
          <select 
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold text-gray-700"
            value={selectedRoleId}
            onChange={(e) => handleRoleChange(Number(e.target.value))}
          >
            <option value={0}>Choose a Role...</option>
            {roles?.map(role => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">2. Select Valid Job Level</label>
          <select 
            className={`w-full px-5 py-4 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold ${
              selectedRoleId === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-700'
            }`}
            value={selectedLevelId}
            disabled={selectedRoleId === 0}
            onChange={(e) => setSelectedLevelId(Number(e.target.value))}
          >
            <option value={0}>{selectedRoleId === 0 ? "Select a Role first" : "Choose a Level..."}</option>
            {filteredLevels.map(level => (
              <option key={level.levelId} value={level.levelId}>
                {level.levelName} ({level.levelCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRoleId > 0 && selectedLevelId > 0 ? (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Permission Matrix</h2>
              <p className="text-sm text-gray-400 mt-0.5">Toggle permissions to update access instantly.</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full">
                {roles?.find(r => r.roleId === selectedRoleId)?.roleName}
              </span>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black uppercase rounded-full">
                {levels?.find(l => l.levelId === selectedLevelId)?.levelName}
              </span>
            </div>
          </div>

          <div className="p-8">
            {loadingAssignments ? (
              <div className="py-12 text-center text-gray-400 italic">Syncing assignments...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPermissions?.map(perm => {
                  const isActive = assignments?.some(a => a.permissionId === perm.permissionId);
                  return (
                    <button
                      key={perm.permissionId}
                      onClick={() => handleTogglePermission(perm.permissionId)}
                      className={`group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        isActive 
                          ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-100' 
                          : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-black uppercase tracking-wider ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                          {perm.permissionName}
                        </span>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                        {isActive ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Selection Required</h3>
          <p className="text-gray-400 mt-2">Choose a role and level above to manage their specific permissions.</p>
        </div>
      )}
    </div>
  );
};

export default RoleLevelPermissionManager;
