package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.ManagerEvaluationResponse;
import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.nio.charset.StandardCharsets;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface ManagerEvaluationMapper {

    @Mapping(target = "appraisalId", source = "appraisal.appraisalId")
    ManagerEvaluationResponse toResponse(ManagerEvaluation entity);

    default String map(byte[] value) {
        return value != null ? new String(value, StandardCharsets.UTF_8) : null;
    }
}
