package ace.org.epms_backend.controller;

import ace.org.epms_backend.dto.ApiResponse;
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
    public ResponseEntity<ApiResponse<Long>> createTeam(@RequestBody TeamRequest request) {
        return new ResponseEntity<>(ApiResponse.success(teamService.createTeam(request)), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getAllTeams() {
        return ResponseEntity.ok(ApiResponse.success(teamService.getAllTeams()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> updateTeam(@PathVariable Long id, @RequestBody TeamRequest request) {
        teamService.updateTeam(id, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<Void>> assignEmployee(@RequestBody TeamAssignmentRequest request) {
        teamService.assignEmployeeToTeam(request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/{teamId}/members/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> removeEmployeeFromTeam(
            @PathVariable Long teamId,
            @PathVariable Long employeeId) {
        teamService.removeMemberFromTeam(teamId, employeeId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(teamId)));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getEmployeeTeams(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getEmployeeTeams(employeeId)));
    }
}
