package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.pip.PipProgressRequest;
import ace.org.epms_backend.dto.pip.PipProgressResponse;
import ace.org.epms_backend.model.pip.PipProgressLog;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PipProgressMapper {

    // =========================
    // ENTITY → RESPONSE
    // =========================
    @Mapping(source = "objective.objectiveId", target = "objectiveId")
    @Mapping(source = "updatedBy", target = "updatedBy")
    PipProgressResponse toResponse(PipProgressLog entity);

    // =========================
    // DTO → ENTITY (CREATE)
    // =========================
    @Mapping(target = "logId", ignore = true)
    @Mapping(target = "objective", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    PipProgressLog toEntity(PipProgressRequest request);

    // =========================
    // OPTIONAL: UPDATE SUPPORT (SAFE DESIGN)
    // =========================
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "logId", ignore = true)
    @Mapping(target = "objective", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntity(PipProgressRequest request, @MappingTarget PipProgressLog entity);
}