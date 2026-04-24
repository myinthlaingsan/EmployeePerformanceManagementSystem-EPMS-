package ace.org.epms_backend.dto.appraisal;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AppraisalDetailsResponse {
    private EmployeeInfo employee;
    private List<QuestionDetail> answers;
    private BigDecimal totalScore;
    private String grade;
    private String status;
    private Boolean employeeSigned;
    private Boolean managerSigned;

    @Data
    @Builder
    public static class EmployeeInfo {
        private String staffName;
        private String employeeCode;
        private String department;
        private String position;
    }

    @Data
    @Builder
    public static class QuestionDetail {
        private Long questionId;
        private String questionText;
        private String categoryName;
        private String selfAnswer;
        private String selfComment;
        private Integer managerRating;
        private String managerComment;
    }
}
