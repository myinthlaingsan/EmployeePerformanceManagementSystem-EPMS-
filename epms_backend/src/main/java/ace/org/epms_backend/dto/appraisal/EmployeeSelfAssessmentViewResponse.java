package ace.org.epms_backend.dto.appraisal;

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
public class EmployeeSelfAssessmentViewResponse {
    private Long selfAssessmentId;
    private Long appraisalId;

    // Employee Info
    private String employeeName;
    private String employeeCode;
    private String departmentName;
    private String positionName;

    private BigDecimal totalScore;
    private Instant submittedAt;

    private List<CategoryViewDTO> categories;

}
