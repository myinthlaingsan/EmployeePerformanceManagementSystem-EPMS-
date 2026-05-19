package ace.org.epms_backend.dto.feedback360;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDraftItemDTO {
    private Long questionId;

    @JsonAlias("rating")
    private Integer score;

    private String comment;
}
