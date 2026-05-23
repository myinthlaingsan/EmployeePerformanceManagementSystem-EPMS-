import { useState } from "react";
import {
  useGetTeamsQuery, useCreateTeamMutation, useDeleteTeamMutation,
  useRemoveTeamMemberMutation, useAssignEmployeeMutation, useGetTeamMembersQuery
} from "../../features/org/teamApi";
import { useGetDepartmentsQuery } from "../../features/org/departmentApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import type { TeamResponse } from "../../features/org/orgTypes";
import { Plus, Trash2, X, Users } from "lucide-react";

const inputStyle: React.CSSProperties = {
  background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8,
  padding: "7px 12px", fontSize: 13, color: "#111827", fontFamily: "inherit", outline: "none", width: "100%",
};

const TeamList = () => {
  const { data: teams, isLoading: teamsLoading } = useGetTeamsQuery();
  const { data: departments } = useGetDepartmentsQuery();
  const { data: pagedEmployees } = useGetEmployeesQuery({ page: 0, size: 1000 });
  const employees = pagedEmployees?.content;

  const [createTeam] = useCreateTeamMutation();
  const [deleteTeam] = useDeleteTeamMutation();
  const [removeMember] = useRemoveTeamMemberMutation();
  const [assignEmployee] = useAssignEmployeeMutation();

  const [newTeamName, setNewTeamName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | "">("");
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [employeeToAssign, setEmployeeToAssign] = useState<number | "">("");
  const [isPrimary, setIsPrimary] = useState(false);

  const { data: members, isLoading: membersLoading } = useGetTeamMembersQuery(selectedTeam?.teamId ?? 0, {
    skip: !selectedTeam,
  });

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !selectedDeptId) return;
    try {
      await createTeam({ teamName: newTeamName, departmentId: Number(selectedDeptId) }).unwrap();
      setNewTeamName(""); setSelectedDeptId("");
    } catch (err) {
      console.error("Failed to create team", err);
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !employeeToAssign) return;
    try {
      await assignEmployee({ teamId: selectedTeam.teamId, employeeId: Number(employeeToAssign), isPrimary }).unwrap();
      setEmployeeToAssign(""); setIsPrimary(false);
    } catch (err) {
      console.error("Failed to assign employee", err);
    }
  };

  if (teamsLoading) return <div className="py-16 text-center" style={{ color: "#9EA3B0", fontSize: 13 }}>Loading teams…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>Team management</h1>
        <p style={{ fontSize: 13, color: "#9EA3B0", marginTop: 2 }}>Create teams and manage their members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: list + create */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create form */}
          <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "16px 18px" }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 12 }}>Add team</p>
            <form onSubmit={handleCreateTeam} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input style={inputStyle} placeholder="Team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
              <select style={inputStyle} value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value === "" ? "" : Number(e.target.value))}>
                <option value="">Select department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                ))}
              </select>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}
              >
                <Plus size={14} aria-hidden="true" /> Add
              </button>
            </form>
          </div>

          {/* Teams table */}
          <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 400 }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #E4E6EC" }}>
                    {["Team name", "Department", "Actions"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 18px", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: i === 2 ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams?.map((team, idx) => (
                    <tr
                      key={team.teamId}
                      style={{
                        borderBottom: idx < teams.length - 1 ? "0.5px solid #F0F2F6" : "none",
                        background: selectedTeam?.teamId === team.teamId ? "#EEF3FD" : undefined,
                        cursor: "pointer",
                      }}
                      className="hover:bg-[#FAFBFF] transition-colors"
                      onClick={() => setSelectedTeam(team)}
                    >
                      <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 500, color: "#111827" }}>{team.teamName}</td>
                      <td style={{ padding: "11px 18px", fontSize: 12, color: "#5A6070" }}>{team.departmentName}</td>
                      <td style={{ padding: "11px 18px", textAlign: "right" }}>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTeam(team); }}
                            style={{ fontSize: 12, color: "#1A56DB", background: "#EEF3FD", border: "0.5px solid #B5D4F4", borderRadius: 6, padding: "3px 8px" }}
                          >
                            Members
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this team?")) deleteTeam(team.teamId); }}
                            className="inline-flex items-center gap-1 transition-colors"
                            style={{ fontSize: 12, color: "#791F1F", background: "#FCEBEB", border: "0.5px solid #F5C2C2", borderRadius: 6, padding: "3px 8px" }}
                          >
                            <Trash2 size={12} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {teams?.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: "24px 18px", textAlign: "center", fontSize: 13, color: "#9EA3B0" }}>No teams yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: member management */}
        <div>
          {selectedTeam ? (
            <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "16px 18px", position: "sticky", top: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>{selectedTeam.teamName}</p>
                  <p style={{ fontSize: 11, color: "#9EA3B0", marginTop: 2 }}>{selectedTeam.departmentName}</p>
                </div>
                <button onClick={() => setSelectedTeam(null)} style={{ color: "#9EA3B0" }} aria-label="Close">
                  <X size={14} />
                </button>
              </div>

              {/* Assign form */}
              <form onSubmit={handleAssignEmployee} className="space-y-3 pb-4" style={{ borderBottom: "0.5px solid #F0F2F6", marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: "#5A6070" }}>Assign member</p>
                <select style={inputStyle} value={employeeToAssign} onChange={(e) => setEmployeeToAssign(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="">Select employee</option>
                  {employees?.filter(emp => 
                    emp.currentDepartmentId === selectedTeam.departmentId && 
                    !members?.some(m => m.employeeId === emp.id)
                  ).map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.staffName} ({emp.employeeCode})</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12, color: "#5A6070" }}>
                  <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} style={{ accentColor: "#1A56DB" }} />
                  Primary team
                </label>
                <button type="submit" className="w-full flex items-center justify-center gap-2 transition-colors"
                  style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "7px 0", fontSize: 13, fontWeight: 500, border: "none" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}
                >
                  <Plus size={13} /> Assign
                </button>
              </form>

              {/* Member list */}
              <p style={{ fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Members</p>
              {membersLoading ? (
                <p style={{ fontSize: 12, color: "#9EA3B0" }}>Loading…</p>
              ) : members && members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.employeeId} className="flex items-center justify-between">
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{member.staffName}</p>
                        <p style={{ fontSize: 11, color: "#9EA3B0" }}>{member.positionName ?? "No position"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.isPrimary && (
                          <span style={{ background: "#EAF3DE", color: "#27500A", fontSize: 11, fontWeight: 500, padding: "2px 6px", borderRadius: 20 }}>Primary</span>
                        )}
                        <button
                          onClick={() => removeMember({ teamId: selectedTeam.teamId, employeeId: member.employeeId })}
                          style={{ color: "#9EA3B0" }} aria-label="Remove member"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#9EA3B0" }}>No members assigned yet.</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center" style={{ background: "#F5F6F8", border: "0.5px dashed #C8CCE0", borderRadius: 12, padding: "32px 18px", minHeight: 200 }}>
              <Users size={24} style={{ color: "#C8CCE0", marginBottom: 8 }} aria-hidden="true" />
              <p style={{ fontSize: 13, color: "#9EA3B0" }}>Select a team to manage its members</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamList;
