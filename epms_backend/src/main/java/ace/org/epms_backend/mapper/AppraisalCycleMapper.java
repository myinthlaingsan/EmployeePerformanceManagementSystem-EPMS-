package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalCycleResponse;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface AppraisalCycleMapper {
    @Mapping(target = "financialYear", ignore = true)
    AppraisalCycle toEntity(AppraisalCycleRequest request);

    @Mapping(target = "financialYearId", source = "financialYear.id")
    @Mapping(target = "financialYearTitle", source = "financialYear.title")
    AppraisalCycleResponse toResponse(AppraisalCycle entity);

    List<AppraisalCycleResponse> toResponseList(List<AppraisalCycle> entities);

    @Mapping(target = "cycleId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "financialYear", ignore = true)
    void updateEntityFromRequest(AppraisalCycleRequest request, @MappingTarget AppraisalCycle entity);
}
