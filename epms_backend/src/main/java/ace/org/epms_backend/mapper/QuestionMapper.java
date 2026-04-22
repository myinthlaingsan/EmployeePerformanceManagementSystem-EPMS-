package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.QuestionRequest;
import ace.org.epms_backend.dto.appraisal.QuestionResponse;
import ace.org.epms_backend.model.appraisal.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface QuestionMapper {

    @Mapping(target = "questionId", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "questionType", expression = "java(QuestionType.valueOf(request.getQuestionType()))")
    Question toEntity(QuestionRequest request);

    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "questionType", expression = "java(entity.getQuestionType().name())")
    QuestionResponse toResponse(Question entity);
}
