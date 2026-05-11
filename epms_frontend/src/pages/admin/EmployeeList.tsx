import {
  useGetEmployeesQuery,
  useSearchEmployeesQuery,
  useDeleteEmployeeMutation,
  useActivateEmployeeMutation
} from "../../features/employee/employeeapi";
import {
  useGetRolesQuery,
  useAssignRoleToEmployeeMutation,
  useRemoveRoleFromEmployeeMutation
} from "../../features/org/roleApi";
import { useGetActiveDepartmentsQuery } from "../../features/org/departmentApi";
import { useGetTeamsQuery } from "../../features/org/teamApi";
import { useDownloadReportMutation } from "../../features/report/reportApi";
import { Link } from "react-router-dom";
import { useState } from "react";

const EmployeeList = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: pagedData, isLoading, error } = useSearchEmployeesQuery({
    query: searchQuery,
    departmentId: selectedDeptId,
    teamId: selectedTeamId,
    page,
    size
  });

  const employees = pagedData?.content;
  const { data: allRoles } = useGetRolesQuery();
  const { data: departments } = useGetActiveDepartmentsQuery();
  const { data: teams } = useGetTeamsQuery();
  const [downloadReport, { isLoading: isDownloading }] = useDownloadReportMutation();

  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [activateEmployee] = useActivateEmployeeMutation();
  // const [deactivateEmployee] = useDeactivateEmployeeMutation();
  const [assignRole] = useAssignRoleToEmployeeMutation();
  const [removeRole] = useRemoveRoleFromEmployeeMutation();

  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);

  const handleDownload = async (format: "pdf" | "xlsx") => {
    try {
      await downloadReport({
        endpoint: "employees",
        params: {
          format,
          ...(selectedDeptId && { departmentId: selectedDeptId }),
          ...(selectedTeamId && { teamId: selectedTeamId }),
          fileName: `Employee_List_${format.toUpperCase()}.${format}`,
        },
      }).unwrap();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download report.");
    }
  };

  const handleRoleToggle = async (empId: number, roleId: number, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeRole({ employeeId: empId, roleId }).unwrap();
      } else {
        await assignRole({ employeeId: empId, body: { roleId } }).unwrap();
      }
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading employees...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">Error loading employees.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff accounts, roles, and status.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-64 shadow-sm group-hover:border-gray-200"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Link
            to="/employees/new"
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff
          </Link>
        </div>
      </div>

      {/* Export & Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-gray-500">Export Filters:</span>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              setSelectedDeptId(e.target.value);
              setSelectedTeamId(""); // Reset team when dept changes
              setPage(0);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Departments</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.departmentName}
              </option>
            ))}
          </select>
          <select
            value={selectedTeamId}
            onChange={(e) => {
              setSelectedTeamId(e.target.value);
              setPage(0);
            }}
            disabled={!!selectedDeptId}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            <option value="">All Teams</option>
            {teams?.map((team) => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload("pdf")}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            PDF
          </button>
          <button
            onClick={() => handleDownload("xlsx")}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Profile</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Department & Position</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Roles</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees?.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                      {emp.profileImage && emp.profileImage !== "default.jpg" ? (
                        <img
                          src={`http://localhost:8080${emp.profileImage}`}
                          alt={emp.staffName}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-sm font-bold text-gray-500">{emp.staffName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{emp.staffName}</div>
                      <div className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{emp.employeeCode}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-700 font-medium">{emp.currentDepartmentName || "No Dept"}</div>
                  <div className="text-sm text-gray-700 font-medium">{emp.parentDepartmentName || "No Dept"}</div>
                  <div className="text-xs text-blue-500 font-bold">{emp.positionName} ({emp.levelName})</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {emp.roles.map(role => (
                      <span key={role} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-blue-100">
                        {role.replace('ROLE_', '')}
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}
                      className="w-6 h-6 flex items-center justify-center border border-dashed border-gray-300 text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-600 transition"
                      title="Manage Roles"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </button>

                    {selectedEmp === emp.id && (
                      <div className="absolute z-50 mt-12 p-3 bg-white border border-gray-100 shadow-2xl rounded-2xl w-52 space-y-2 animate-in fade-in zoom-in duration-150">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">Assign Roles</p>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {allRoles?.map(role => {
                            const hasRole = emp.roles.includes(role.roleName) || emp.roles.includes(`ROLE_${role.roleName}`);
                            return (
                              <label key={role.roleId} className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 rounded-xl cursor-pointer transition group/role">
                                <div className="relative flex items-center">
                                  <input
                                    type="checkbox"
                                    className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                                    checked={hasRole}
                                    onChange={() => handleRoleToggle(emp.id, role.roleId, hasRole)}
                                  />
                                  <svg className="absolute w-3 h-3 text-white hidden peer-checked:block left-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-600 group-hover/role:text-blue-600 transition">{role.roleName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <Link
                      to={`/employees/${emp.id}/departments`}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Manage Departments"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </Link>
                    <Link
                      to={`/employees/edit/${emp.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => emp.id && deleteEmployee(emp.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Staff"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <div className="h-4 w-px bg-gray-100 mx-1"></div>
                    <button
                      onClick={() => emp.id && activateEmployee(emp.id)}
                      className="text-[10px] font-black uppercase text-green-500 hover:text-green-700 transition"
                    >
                      Activate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagedData && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing {pagedData.content.length} of {pagedData.totalElements} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              {[...Array(pagedData.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${page === i
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={pagedData.last}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
