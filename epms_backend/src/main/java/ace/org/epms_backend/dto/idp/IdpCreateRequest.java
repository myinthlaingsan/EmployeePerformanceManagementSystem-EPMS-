package ace.org.epms_backend.dto.idp;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class IdpCreateRequest {
    @NotNull
    private Long employeeId;
    private Long managerId;
    private Long appraisalId;
    @NotBlank
    private String title;
    private String summary;
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
    private List<LocalDate> scheduledFollowUpDates;
}
