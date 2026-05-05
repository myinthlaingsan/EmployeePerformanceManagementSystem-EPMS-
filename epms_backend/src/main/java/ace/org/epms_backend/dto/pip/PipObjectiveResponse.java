package ace.org.epms_backend.dto.pip;

import ace.org.epms_backend.enums.ObjectiveStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PipObjectiveResponse {

    private Long objectiveId;
    private Long pipId;

    private String title;
    private String description;
    private String successCriteria;

    private LocalDate targetDate;

    private ObjectiveStatus status;
    private Boolean isAchieved;
}