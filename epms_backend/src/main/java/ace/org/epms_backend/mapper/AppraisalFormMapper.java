package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormResponse;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface AppraisalFormMapper {
    AppraisalForm toEntity(AppraisalFormRequest request);

    AppraisalFormResponse toResponse(AppraisalForm entity);

    List<AppraisalFormResponse> toResponseList(List<AppraisalForm> entities);

    @Mapping(target = "formId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(AppraisalFormRequest request, @MappingTarget AppraisalForm entity);
}
