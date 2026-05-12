package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationValidationResponse {
    private boolean isValid;
    private List<String> warnings;
    private List<String> errors;
}
