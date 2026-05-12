package ace.org.epms_backend.dto.feedback360;

import ace.org.epms_backend.enums.QuestionType;
import lombok.Data;

import java.util.List;

@Data
public class FeedbackFormCreationRequest {
    private String formName;
    private List<CategoryPayload> categories;

    @Data
    public static class CategoryPayload {
        private String categoryName;
        private List<QuestionPayload> questions;
    }

    @Data
    public static class QuestionPayload {
        private String questionText;
        private QuestionType questionType;
        private Boolean isRequired;
        private Boolean requiresComment;
    }
}
