package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.ManagerEvaluationResponse;
import ace.org.epms_backend.model.appraisal.ManagerEvaluation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface ManagerEvaluationMapper {

    @Mapping(target = "appraisalId", source = "appraisal.appraisalId")
    ManagerEvaluationResponse toResponse(ManagerEvaluation entity);
}
