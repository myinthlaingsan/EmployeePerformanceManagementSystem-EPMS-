package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.PositionRequest;
import ace.org.epms_backend.dto.org.PositionResponse;
import ace.org.epms_backend.model.employee.Position;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface PositionMapper {
    @Mapping(target = "positionId", ignore = true)
    @Mapping(target = "level", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Position toEntity(PositionRequest request);

    @Mapping(source = "level.levelId", target = "levelId")
    @Mapping(source = "level.levelName", target = "levelName")
    PositionResponse toResponse(Position position);

    @Mapping(target = "positionId", ignore = true)
    @Mapping(target = "level", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(PositionRequest request, @MappingTarget Position position);
}
