package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeFeedbackDTO {
    private String employeeName;
    private int requestedCount;
    private int completedCount;
    private double participationRate;
}
