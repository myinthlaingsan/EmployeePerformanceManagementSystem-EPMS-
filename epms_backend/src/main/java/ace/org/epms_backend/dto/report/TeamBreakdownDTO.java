package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TeamBreakdownDTO {
    private String teamName;
    private double averageScore;
    private List<TeamMemberBreakdownDTO> members;
}
