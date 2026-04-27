package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PipObjectiveRequest {

    private Long pipId;

    private String title;
    private String description;
    private String successCriteria;

    private LocalDate targetDate;
}