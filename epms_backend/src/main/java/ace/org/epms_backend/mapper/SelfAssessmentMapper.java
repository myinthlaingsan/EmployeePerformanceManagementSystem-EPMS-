package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.SelfAssessmentResponse;
import ace.org.epms_backend.model.appraisal.SelfAssessment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.nio.charset.StandardCharsets;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface SelfAssessmentMapper {

    @Mapping(target = "appraisalId", source = "appraisal.appraisalId")
    SelfAssessmentResponse toResponse(SelfAssessment entity);

    default String map(byte[] value) {
        return value != null ? new String(value, StandardCharsets.UTF_8) : null;
    }
}
