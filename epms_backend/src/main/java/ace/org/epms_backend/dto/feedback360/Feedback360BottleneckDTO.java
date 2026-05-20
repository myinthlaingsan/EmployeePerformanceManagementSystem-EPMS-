package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Feedback360BottleneckDTO {
    private Long evaluatorId;
    private String evaluatorName;
    private String evaluatorEmail;
    private String departmentName;
    private Long pendingCount;
}
