package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.CycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalCycleRequest {
    private String cycleName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String evaluationPeriod;
    private CycleStatus status;
    private Boolean isActive;
}
