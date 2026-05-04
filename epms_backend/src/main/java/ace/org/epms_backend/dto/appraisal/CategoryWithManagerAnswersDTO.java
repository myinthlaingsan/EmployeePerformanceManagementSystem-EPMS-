package ace.org.epms_backend.dto.appraisal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryWithManagerAnswersDTO {
    private Long categoryId;
    private String categoryName;
    private List<QuestionWithManagerAnswerDTO> questions;
}
