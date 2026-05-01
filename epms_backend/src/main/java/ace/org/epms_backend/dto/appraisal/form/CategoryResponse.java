package ace.org.epms_backend.dto.appraisal.form;

import lombok.Data;
import java.util.List;

@Data
public class CategoryResponse {
    private Long categoryId;
    private String categoryName;
    private List<QuestionResponse> questions;
}
