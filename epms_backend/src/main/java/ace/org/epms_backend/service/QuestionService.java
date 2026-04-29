package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.appraisal.form.QuestionRequest;
import ace.org.epms_backend.dto.appraisal.form.QuestionResponse;

import java.util.List;

public interface QuestionService {
    QuestionResponse create(QuestionRequest request);

    List<QuestionResponse> getByCategoryId(Long categoryId);

    QuestionResponse getById(Long id);

    QuestionResponse update(Long id, QuestionRequest request);

    void delete(Long id);
}
