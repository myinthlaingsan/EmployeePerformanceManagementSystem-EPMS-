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
    private String departmentName;

    private Long managerId;
    private String managerName;
    private Long cycleId;
    private String cycleName;
    private Long formId;
    private String formName;
    private Long formSetId;
    private String formSetName;
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
    private String employeeSignNote;
    private String managerSignNote;
    private String approvalComment;
    private Boolean isLocked;
    
    private java.math.BigDecimal finalScore;
    private String finalGrade;
}
