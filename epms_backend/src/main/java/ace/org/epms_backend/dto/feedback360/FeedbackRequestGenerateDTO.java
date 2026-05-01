package ace.org.epms_backend.dto.feedback360;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FeedbackRequestGenerateDTO {

    @NotNull
    private Long cycleId;

    @NotEmpty
    private List<Long> employeeIds;

    // number of peers to assign (e.g., 3–5)
    private Integer peerLimit = 3;

    // include subordinates (bottom-up)
    private Boolean includeSubordinates = true;
}
