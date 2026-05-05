package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.SelfAssessmentResponse;
import ace.org.epms_backend.model.appraisal.SelfAssessment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface SelfAssessmentMapper {

    @Mapping(target = "appraisalId", source = "appraisal.appraisalId")
    SelfAssessmentResponse toResponse(SelfAssessment entity);
}
