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
    private String employeeName;
    private String employeeCode;
    private String positionName;
    private String departmentName;

    // Cycle Info
    private java.time.LocalDate cycleStartDate;
    private java.time.LocalDate cycleEndDate;

    private BigDecimal totalScore;
    private Boolean submitted;
    private Instant lastSavedAt;
    private Instant submittedAt;

    private List<CategoryWithAnswersDTO> categories;
}
