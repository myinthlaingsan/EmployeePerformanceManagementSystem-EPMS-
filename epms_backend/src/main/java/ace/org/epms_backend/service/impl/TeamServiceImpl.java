package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeTeam;
import ace.org.epms_backend.model.employee.Team;
import ace.org.epms_backend.repository.DepartmentRepository;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.TeamRepository;
import ace.org.epms_backend.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final EmployeeRepository employeeRepository;
    private final EmployeeTeamRepository employeeTeamRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public Long createTeam(TeamRequest request) {
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found"));

        Team team = Team.builder()
                .teamName(request.getTeamName())
                .department(dept)
                .isActive(true)
                .build();
        return teamRepository.save(team).getTeamId();
    }

    @Override
    @Transactional
    public void assignEmployeeToTeam(TeamAssignmentRequest request) {
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        Team team = teamRepository.findById(request.getTeamId())
                .orElseThrow(() -> new NotFoundException("Team not found"));

        EmployeeTeam et = EmployeeTeam.builder()
                .employee(employee)
                .team(team)
                .isPrimary(request.getIsPrimary())
                .build();
        employeeTeamRepository.save(et);
    }

    @Override
    public List<TeamMemberResponse> getTeamMembers(Long teamId) {
        return employeeTeamRepository.findByTeamTeamId(teamId).stream()
                .map(et -> {
                    TeamMemberResponse res = new TeamMemberResponse();
                    res.setEmployeeId(et.getEmployee().getId());
                    res.setStaffName(et.getEmployee().getStaffName());
                    res.setPositionName(et.getEmployee().getPosition() != null ? et.getEmployee().getPosition().getPositionName() : null);
                    res.setIsPrimary(et.getIsPrimary());
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    public List<TeamResponse> getEmployeeTeams(Long employeeId) {
        return employeeTeamRepository.findByEmployeeId(employeeId).stream()
                .map(et -> {
                    TeamResponse res = new TeamResponse();
                    res.setTeamId(et.getTeam().getTeamId());
                    res.setTeamName(et.getTeam().getTeamName());
                    res.setDepartmentName(et.getTeam().getDepartment().getDepartmentName());
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    public List<TeamResponse> getAllTeams() {
        return teamRepository.findAll().stream()
                .filter(Team::getIsActive)
                .map(team -> {
                    TeamResponse res = new TeamResponse();
                    res.setTeamId(team.getTeamId());
                    res.setTeamName(team.getTeamName());
                    res.setDepartmentName(team.getDepartment().getDepartmentName());
                    return res;
                }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateTeam(Long id, TeamRequest request) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        
        Department dept = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found"));
        
        team.setTeamName(request.getTeamName());
        team.setDepartment(dept);
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public void deleteTeam(Long id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Team not found"));
        team.setIsActive(false);
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public void removeMemberFromTeam(Long teamId, Long employeeId) {
        if (!teamRepository.existsById(teamId)) {
            throw new NotFoundException("Team not found");
        }
        if (!employeeRepository.existsById(employeeId)) {
            throw new NotFoundException("Employee not found");
        }
        employeeTeamRepository.deleteByEmployeeIdAndTeamTeamId(employeeId, teamId);
    }
}
