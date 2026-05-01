package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedComment {
    private String categoryName;
    private String evaluatorRole;
    private String evaluatorName;
    private String comment;
    private Integer score;
}
