package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.model.pip.PipProgressLog;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PipProgressMapper {

    @Mapping(source = "objective.objectiveId", target = "objectiveId")
    PipProgressResponse toResponse(PipProgressLog entity);

    @Mapping(target = "logId", ignore = true)
    @Mapping(target = "objective", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    PipProgressLog toEntity(PipProgressRequest request);
}