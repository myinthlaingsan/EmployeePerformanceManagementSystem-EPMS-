import {
  useSearchEmployeesQuery, useDeleteEmployeeMutation, useActivateEmployeeMutation, useDeactivateEmployeeMutation
} from "../../features/employee/employeeapi";
import {
  useGetRolesQuery, useAssignRoleToEmployeeMutation, useRemoveRoleFromEmployeeMutation
} from "../../features/org/roleApi";
import { useGetActiveDepartmentsQuery } from "../../features/org/departmentApi";
import { useGetTeamsQuery } from "../../features/org/teamApi";
import { useDownloadReportMutation } from "../../features/report/reportApi";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, Download, Search, Settings2 } from "lucide-react";

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const selectStyle: React.CSSProperties = {
  background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8,
  padding: "6px 10px", fontSize: 12, color: "#111827", fontFamily: "inherit", outline: "none",
};

const EmployeeList = () => {
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedEmp, setSelectedEmp] = useState<number | null>(null);

  const { data: pagedData, isLoading, error } = useSearchEmployeesQuery({ query: searchQuery, departmentId: selectedDeptId, teamId: selectedTeamId, page, size });
  const employees = pagedData?.content;
  const { data: allRoles } = useGetRolesQuery();
  const { data: departments } = useGetActiveDepartmentsQuery();
  const { data: teams } = useGetTeamsQuery();
  const [downloadReport, { isLoading: isDownloading }] = useDownloadReportMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [activateEmployee] = useActivateEmployeeMutation();
  const [deactivateEmployee] = useDeactivateEmployeeMutation();
  const [assignRole] = useAssignRoleToEmployeeMutation();
  const [removeRole] = useRemoveRoleFromEmployeeMutation();

  const handleDownload = async (format: "pdf" | "xlsx") => {
    try {
      await downloadReport({
        endpoint: "employees",
        fileName: `Employee_List.${format}`,
        params: { format, ...(selectedDeptId && { departmentId: selectedDeptId }), ...(selectedTeamId && { teamId: selectedTeamId }) },
      }).unwrap();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleRoleToggle = async (empId: number, roleId: number, hasRole: boolean) => {
    try {
      if (hasRole) await removeRole({ employeeId: empId, roleId }).unwrap();
      else await assignRole({ employeeId: empId, body: { roleId } }).unwrap();
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  if (isLoading) return <div className="py-16 text-center" style={{ color: "#9EA3B0", fontSize: 13 }}>Loading employees…</div>;
  if (error) return <div className="py-16 text-center" style={{ color: "#791F1F", fontSize: 13 }}>Error loading employees.</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>Employees</h1>
          <p style={{ fontSize: 13, color: "#9EA3B0", marginTop: 2 }}>Manage staff accounts, roles, and status.</p>
        </div>
        <Link
          to="/employees/new"
          className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
          style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}
        >
          <Plus size={14} aria-hidden="true" /> Add staff
        </Link>
      </div>

      {/* Filters & export bar */}
      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "12px 16px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-3 pointer-events-none" style={{ color: "#9EA3B0" }} aria-hidden="true" />
              <input
                type="text"
                placeholder="Search staff…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                style={{ ...selectStyle, paddingLeft: 30, width: 180 }}
              />
            </div>
            <select value={selectedDeptId} onChange={(e) => { setSelectedDeptId(e.target.value); setSelectedTeamId(""); setPage(0); }} style={selectStyle}>
              <option value="">All departments</option>
              {departments?.map((dept) => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
            </select>
            <select value={selectedTeamId} onChange={(e) => { setSelectedTeamId(e.target.value); setPage(0); }} disabled={!!selectedDeptId} style={{ ...selectStyle, opacity: selectedDeptId ? 0.5 : 1 }}>
              <option value="">All teams</option>
              {teams?.map((team) => <option key={team.teamId} value={team.teamId}>{team.teamName}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleDownload("pdf")} disabled={isDownloading}
              className="inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ fontSize: 12, color: "#791F1F", background: "#FCEBEB", border: "0.5px solid #F5C2C2", borderRadius: 6, padding: "5px 10px" }}>
              <Download size={12} /> PDF
            </button>
            <button onClick={() => handleDownload("xlsx")} disabled={isDownloading}
              className="inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              style={{ fontSize: 12, color: "#27500A", background: "#EAF3DE", border: "0.5px solid #B8DCA0", borderRadius: 6, padding: "5px 10px" }}>
              <Download size={12} /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, overflow: "hidden" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #E4E6EC" }}>
                {["Employee", "Department & position", "Roles", "Actions"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 3 ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp, idx) => {
                const avatarColor = AVATAR_COLORS[(emp.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
                return (
                  <tr key={emp.id} style={{ borderBottom: idx < employees.length - 1 ? "0.5px solid #F0F2F6" : "none" }}
                    className="hover:bg-[#FAFBFF] transition-colors">
                    {/* Employee */}
                    <td style={{ padding: "11px 18px" }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {emp.profileImage && emp.profileImage !== "default.jpg" ? (
                            <img src={`http://localhost:8080${emp.profileImage}`} alt={emp.staffName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          ) : emp.staffName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{emp.staffName}</p>
                          <p style={{ fontSize: 11, color: "#9EA3B0", fontFamily: "monospace" }}>{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    {/* Department */}
                    <td style={{ padding: "11px 18px" }}>
                      <p style={{ fontSize: 12, color: "#5A6070" }}>{emp.currentDepartmentName ?? "—"}</p>
                      <p style={{ fontSize: 11, color: "#1A56DB" }}>{emp.positionName} {emp.levelName ? `(${emp.levelName})` : ""}</p>
                    </td>
                    {/* Roles */}
                    <td style={{ padding: "11px 18px" }}>
                      <div className="flex flex-wrap gap-1 items-center relative">
                        {emp.roles.map(role => (
                          <span key={role} style={{ background: "#EEF3FD", color: "#0C447C", fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 20 }}>
                            {role.replace("ROLE_", "")}
                          </span>
                        ))}
                        <button
                          onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}
                          title="Manage roles"
                          style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px dashed #C8CCE0", borderRadius: 6, color: "#9EA3B0" }}
                        >
                          <Settings2 size={12} aria-hidden="true" />
                        </button>

                        {selectedEmp === emp.id && (
                          <div className="absolute z-50 top-7 left-0 w-52 space-y-1" style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 10, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>Assign roles</p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {allRoles?.map(role => {
                                const hasRole = emp.roles.includes(role.roleName) || emp.roles.includes(`ROLE_${role.roleName}`);
                                return (
                                  <label key={role.roleId} className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1 hover:bg-[#F5F6F8] transition-colors">
                                    <input type="checkbox" checked={hasRole} onChange={() => handleRoleToggle(emp.id, role.roleId, hasRole)} style={{ accentColor: "#1A56DB" }} />
                                    <span style={{ fontSize: 12, color: "#5A6070" }}>{role.roleName}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: "11px 18px", textAlign: "right" }}>
                      <div className="flex justify-end items-center gap-1">
                        <Link to={`/employees/${emp.id}/departments`} title="Manage departments"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#9EA3B0", borderRadius: 6 }}
                          className="hover:bg-info-fill hover:text-[#1A56DB] transition-colors">
                          <Building2 size={14} aria-hidden="true" />
                        </Link>
                        <Link to={`/employees/edit/${emp.id}`} title="Edit"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#9EA3B0", borderRadius: 6 }}
                          className="hover:bg-info-fill hover:text-[#1A56DB] transition-colors">
                          <Pencil size={14} aria-hidden="true" />
                        </Link>
                        <button onClick={() => emp.id && deleteEmployee(emp.id)} title="Delete"
                          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#9EA3B0", borderRadius: 6 }}
                          className="hover:bg-danger-fill hover:text-danger-text transition-colors">
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                        <div style={{ width: 1, height: 14, background: "#E4E6EC", margin: "0 2px" }} />
                        {emp.status !== "ACTIVE" ? (
                          <button
                            onClick={async () => { try { await activateEmployee(emp.id).unwrap(); } catch (err) { console.error("Activate failed:", err); } }}
                            style={{ fontSize: 11, fontWeight: 500, color: "#27500A", background: "#EAF3DE", border: "0.5px solid #B8DCA0", borderRadius: 6, padding: "3px 8px" }}>
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={async () => { try { await deactivateEmployee(emp.id).unwrap(); } catch (err) { console.error("Deactivate failed:", err); } }}
                            style={{ fontSize: 11, fontWeight: 500, color: "#791F1F", background: "#FCEBEB", border: "0.5px solid #F5C2C2", borderRadius: 6, padding: "3px 8px" }}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees?.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "#9EA3B0" }}>No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagedData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "12px 18px" }}>
          <p style={{ fontSize: 12, color: "#9EA3B0" }}>
            Showing {pagedData.content.length} of {pagedData.totalElements} results
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 0}
              className="transition-colors disabled:opacity-30"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "#F5F6F8", border: "0.5px solid #E0E2E8", color: "#5A6070" }}>
              ‹
            </button>
            {[...Array(pagedData.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                style={{ width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: page === i ? 500 : 400, background: page === i ? "#1A56DB" : "#F5F6F8", color: page === i ? "#FFFFFF" : "#5A6070", border: page === i ? "none" : "0.5px solid #E0E2E8" }}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={pagedData.last}
              className="transition-colors disabled:opacity-30"
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "#F5F6F8", border: "0.5px solid #E0E2E8", color: "#5A6070" }}>
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
