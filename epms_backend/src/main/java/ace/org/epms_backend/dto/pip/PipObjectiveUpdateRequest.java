package ace.org.epms_backend.dto.pip;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipObjectiveUpdateRequest {
    private String title;
    private String description;
    private String successCriteria;
}
