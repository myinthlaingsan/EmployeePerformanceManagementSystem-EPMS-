package ace.org.epms_backend.dto.idp;

import ace.org.epms_backend.enums.DevelopmentGoalCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class DevelopmentGoalRequest {
    @NotNull
    private Long idpId;
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private DevelopmentGoalCategory category;
    private String successCriteria;
    @NotNull
    private LocalDate targetDate;
}
