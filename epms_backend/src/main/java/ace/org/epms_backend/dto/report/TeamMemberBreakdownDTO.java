package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TeamMemberBreakdownDTO {
    private Long employeeId;
    private String employeeName;
    private String role;
    private double averageScore;
}
