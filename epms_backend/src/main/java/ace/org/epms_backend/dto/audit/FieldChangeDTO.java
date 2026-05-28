package ace.org.epms_backend.dto.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldChangeDTO {
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String dataType;
}
