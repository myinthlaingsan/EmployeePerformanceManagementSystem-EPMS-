package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.QuestionRequest;
import ace.org.epms_backend.dto.appraisal.QuestionResponse;
import ace.org.epms_backend.enums.QuestionType;
import ace.org.epms_backend.model.appraisal.Question;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true), imports = {QuestionType.class})
public interface QuestionMapper {

    @Mapping(target = "questionId", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "questionType", expression = "java(QuestionType.valueOf(request.getQuestionType()))")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Question toEntity(QuestionRequest request);

    @Mapping(target = "categoryId", source = "category.categoryId")
    @Mapping(target = "questionType", expression = "java(entity.getQuestionType() != null ? entity.getQuestionType().name() : null)")
    QuestionResponse toResponse(Question entity);

    List<QuestionResponse> toResponseList(List<Question> entities);

    @Mapping(target = "questionId", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "questionType", expression = "java(QuestionType.valueOf(request.getQuestionType()))")
    void updateEntityFromRequest(QuestionRequest request, @MappingTarget Question entity);
}
