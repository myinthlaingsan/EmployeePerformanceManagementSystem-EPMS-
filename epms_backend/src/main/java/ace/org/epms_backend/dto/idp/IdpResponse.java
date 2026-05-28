package ace.org.epms_backend.dto.idp;

import ace.org.epms_backend.enums.IdpStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class IdpResponse {
    private Long idpId;
    private Long employeeId;
    private String employeeName;
    private Long managerId;
    private String managerName;
    private Long appraisalId;
    private String title;
    private String summary;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<LocalDate> scheduledFollowUpDates;
    private IdpStatus status;
    private Integer overallProgress;
    private Integer goalCount;
    private Integer completedGoalCount;
    private Long createdBy;
}
