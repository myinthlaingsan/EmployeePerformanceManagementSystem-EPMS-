package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.pip.PipObjectiveRequest;
import ace.org.epms_backend.dto.pip.PipObjectiveResponse;
import ace.org.epms_backend.model.pip.PipObjective;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PipObjectiveMapper {

    @Mapping(source = "pip.pipId", target = "pipId")
    PipObjectiveResponse toResponse(PipObjective entity);

    @Mapping(target = "objectiveId", ignore = true)
    @Mapping(target = "pip", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "isAchieved", expression = "java(false)")
    @Mapping(target = "isActive", expression = "java(true)")
    PipObjective toEntity(PipObjectiveRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(PipObjectiveRequest request, @MappingTarget PipObjective entity);
}