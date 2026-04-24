package ace.org.epms_backend.mapper;


import ace.org.epms_backend.dto.pip.PipCreateRequest;
import ace.org.epms_backend.dto.pip.PipResponse;
import ace.org.epms_backend.model.pip.PipRecord;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PipMapper {

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "manager.id", target = "managerId")
    PipResponse toResponse(PipRecord entity);

    @Mapping(target = "pipId", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "appraisal", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "finalOutcome", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdBy", ignore = true)
    PipRecord toEntity(PipCreateRequest request);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(PipCreateRequest request, @MappingTarget PipRecord entity);
}