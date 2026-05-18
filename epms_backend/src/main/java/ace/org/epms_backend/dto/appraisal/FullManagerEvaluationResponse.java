package ace.org.epms_backend.dto.appraisal;

import ace.org.epms_backend.enums.FormType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FullManagerEvaluationResponse {
    private Long evaluationId;
    private Long appraisalId;
    private String formName;
    private FormType formType;
    private String appraisalStatus;

    // Manager Info
    private Long managerId;

    // Employee Info
    private String employeeName;
    private Long employeeId;
    private String employeeCode;
    private String positionName;
    private String departmentName;

    // Cycle Info
    private java.time.LocalDate cycleStartDate;
    private java.time.LocalDate cycleEndDate;
    private java.time.LocalDate selfAssessmentDeadline;
    private java.time.LocalDate managerEvaluationDeadline;

    private BigDecimal totalScore;
    private Boolean submitted;
    private Instant lastSavedAt;
    private String finalComment;
    private Instant submittedAt;
    private Boolean isSelfSubmitted;

    // Signatures
    private Instant employeeSignedAt;
    private Instant managerSignedAt;
    private String employeeSignature;
    private String managerSignature;
    private String employeeSignComment;
    private String managerSignComment;

    private List<CategoryWithManagerAnswersDTO> categories;
}
