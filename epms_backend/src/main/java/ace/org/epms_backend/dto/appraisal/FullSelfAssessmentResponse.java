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
public class FullSelfAssessmentResponse {
    private Long selfAssessmentId;
    private Long appraisalId;
    private String formName;
    private FormType formType;

    // Employee Info
    private Long employeeId;
    private String employeeName;
    private String employeeCode;
    private String positionName;
    private String departmentName;
    private String managerName;

    // Cycle Info
    private java.time.LocalDate cycleStartDate;
    private java.time.LocalDate cycleEndDate;
    private java.time.LocalDate selfAssessmentDeadline;
    private java.time.LocalDate managerEvaluationDeadline;

    private BigDecimal totalScore;
    private Boolean submitted;
    private Instant lastSavedAt;
    private Instant submittedAt;

    // Signatures
    private Instant employeeSignedAt;
    private Instant managerSignedAt;
    private String employeeSignature;
    private String employeeSignComment;
    private String managerSignComment;
    private String overallReflection;

    private List<CategoryWithAnswersDTO> categories;
}
