package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.AppraisalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppraisalResponse {

    private Long appraisalId;
    private Long employeeId;
    private String employeeName;
    private String employeeCode;

    private Long managerId;
    private String managerName;
    private Long cycleId;
    private String cycleName;
    private Long formId;
    private String formName;
    private AppraisalStatus status;

    private Instant assignedAt;
    private Instant selfSubmittedAt;
    private Instant managerSubmittedAt;
    private Instant hrApprovedAt;
    private Instant finalizedAt;
    private Instant employeeSignedAt;
    private Instant managerSignedAt;
    private Instant lockedAt;

    private String employeeSignComment;
    private String managerSignComment;
    private String approvalComment;
    private Boolean isLocked;
}
