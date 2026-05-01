package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<Long> createTeam(@RequestBody TeamRequest request) {
        return new ResponseEntity<>(teamService.createTeam(request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @PostMapping("/assign")
    public ResponseEntity<Void> assignEmployee(@RequestBody TeamAssignmentRequest request) {
        teamService.assignEmployeeToTeam(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberResponse>> getMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(teamService.getTeamMembers(teamId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TeamResponse>> getEmployeeTeams(@PathVariable Long employeeId) {
        return ResponseEntity.ok(teamService.getEmployeeTeams(employeeId));
    }
}
