package ace.org.epms_backend.dto.idp;

import ace.org.epms_backend.enums.DevelopmentGoalCategory;
import ace.org.epms_backend.enums.DevelopmentGoalStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DevelopmentGoalUpdateRequest {
    private String title;
    private String description;
    private DevelopmentGoalCategory category;
    private String successCriteria;
    private LocalDate targetDate;
    private DevelopmentGoalStatus status;
    private String managerComment;
    private String employeeComment;
}
