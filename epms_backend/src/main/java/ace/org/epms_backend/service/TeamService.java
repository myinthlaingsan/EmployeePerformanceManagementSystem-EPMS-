package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.employee.*;
import java.util.List;

public interface TeamService {
    Long createTeam(TeamRequest request);
    void assignEmployeeToTeam(TeamAssignmentRequest request);
    List<TeamMemberResponse> getTeamMembers(Long teamId);
    List<TeamResponse> getEmployeeTeams(Long employeeId);
    List<TeamResponse> getAllTeams();
    void updateTeam(Long id, TeamRequest request);
    void deleteTeam(Long id);
    void removeMemberFromTeam(Long teamId, Long employeeId);
}
