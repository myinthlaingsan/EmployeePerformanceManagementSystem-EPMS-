import { useState } from "react";
import {
  useGetTeamsQuery,
  useCreateTeamMutation,
  useDeleteTeamMutation,
  useRemoveTeamMemberMutation,
  useAssignEmployeeMutation,
  useGetTeamMembersQuery
} from "../../features/org/teamApi";
import { useGetDepartmentsQuery } from "../../features/org/departmentApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import type { TeamResponse } from "../../features/org/orgTypes";

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
      await createTeam({
        teamName: newTeamName,
        departmentId: Number(selectedDeptId)
      }).unwrap();
      setNewTeamName("");
      setSelectedDeptId("");
    } catch (err) {
      console.error("Failed to create team", err);
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !employeeToAssign) return;
    try {
      await assignEmployee({
        teamId: selectedTeam.teamId,
        employeeId: Number(employeeToAssign),
        isPrimary,
      }).unwrap();
      setEmployeeToAssign("");
      setIsPrimary(false);
    } catch (err) {
      console.error("Failed to assign employee", err);
    }
  };

  if (teamsLoading) return <div className="p-8 text-center">Loading teams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team List and Create Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Team Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Team Name"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">Select Department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                ))}
              </select>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Add Team
              </button>
            </form>
          </div>

          {/* Teams Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teams?.map((team) => (
                  <tr
                    key={team.teamId}
                    className={`hover:bg-gray-50 transition cursor-pointer ${selectedTeam?.teamId === team.teamId ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{team.teamName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{team.departmentName}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex justify-end items-center space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeam(team);
                          }}
                        >
                          Manage Members
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this team?")) {
                              deleteTeam(team.teamId);
                            }
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Member Management (Contextual) */}
        <div className="space-y-6">
          {selectedTeam ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
              <h2 className="text-lg font-semibold mb-2">Members of {selectedTeam.teamName}</h2>
              <p className="text-sm text-gray-500 mb-6">{selectedTeam.departmentName} Department</p>

              {/* Assign Form */}
              <form onSubmit={handleAssignEmployee} className="space-y-4 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Assign New Member</h3>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={employeeToAssign}
                  onChange={(e) => setEmployeeToAssign(e.target.value === "" ? "" : Number(e.target.value))}
                >
                  <option value="">Select Employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.staffName} ({emp.employeeCode})</option>
                  ))}
                </select>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Is Primary Team?</span>
                </label>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  Assign to Team
                </button>
              </form>

              {/* Member List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Current Members</h3>
                {membersLoading ? (
                  <p className="text-sm text-gray-400 italic">Loading members...</p>
                ) : members && members.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {members.map((member) => (
                      <div key={member.employeeId} className="py-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.staffName}</p>
                          <p className="text-xs text-gray-500">{member.positionName || 'No Position'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {member.isPrimary && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                              Primary
                            </span>
                          )}
                          <button
                            onClick={() => removeMember({ teamId: selectedTeam.teamId, employeeId: member.employeeId })}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Remove from team"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No members assigned yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-75">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Select a team to manage its members</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamList;
