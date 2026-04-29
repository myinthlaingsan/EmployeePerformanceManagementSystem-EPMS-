package ace.org.epms_backend.service.impl;



import ace.org.epms_backend.dto.appraisal.form.QuestionRequest;
import ace.org.epms_backend.dto.appraisal.form.QuestionResponse;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.QuestionMapper;
import ace.org.epms_backend.model.appraisal.FormCategory;
import ace.org.epms_backend.model.appraisal.Question;
import ace.org.epms_backend.repository.FormCategoryRepository;
import ace.org.epms_backend.repository.QuestionRepository;
import ace.org.epms_backend.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final FormCategoryRepository formCategoryRepository;
    private final QuestionMapper questionMapper;

    @Override
    @Transactional
    public QuestionResponse create(QuestionRequest request) {
        FormCategory category = formCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("FormCategory not found with id: " + request.getCategoryId()));

        Question question = questionMapper.toEntity(request);
        question.setCategory(category);
        question = questionRepository.save(question);

        return questionMapper.toResponse(question);
    }

    @Override
    public List<QuestionResponse> getByCategoryId(Long categoryId) {
        if (categoryId == null) {
            return questionMapper.toResponseList(questionRepository.findAll());
        }
        List<Question> questions = questionRepository.findByCategory_CategoryId(categoryId);
        return questionMapper.toResponseList(questions);
    }

    @Override
    public QuestionResponse getById(Long id) {
        Question question = getQuestionById(id);
        return questionMapper.toResponse(question);
    }

    @Override
    @Transactional
    public QuestionResponse update(Long id, QuestionRequest request) {
        Question question = getQuestionById(id);

        if (!question.getCategory().getCategoryId().equals(request.getCategoryId())) {
            FormCategory category = formCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("FormCategory not found with id: " + request.getCategoryId()));
            question.setCategory(category);
        }

        questionMapper.updateEntityFromRequest(request, question);
        question = questionRepository.save(question);
        return questionMapper.toResponse(question);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Question question = getQuestionById(id);
        questionRepository.delete(question);
    }

    private Question getQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));
    }
}
