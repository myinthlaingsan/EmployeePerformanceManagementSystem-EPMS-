package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.idp.DevelopmentProgressRequest;
import ace.org.epms_backend.dto.idp.DevelopmentProgressResponse;
import ace.org.epms_backend.model.idp.DevelopmentProgressUpdate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface DevelopmentProgressMapper {

    @Mapping(source = "goal.goalId", target = "goalId")
    @Mapping(source = "updatedBy.id", target = "updatedBy")
    @Mapping(source = "updatedBy.staffName", target = "updatedByName")
    DevelopmentProgressResponse toResponse(DevelopmentProgressUpdate entity);

    @Mapping(target = "updateId", ignore = true)
    @Mapping(target = "goal", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    DevelopmentProgressUpdate toEntity(DevelopmentProgressRequest request);
}
