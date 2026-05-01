package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.OneOnOneMeetingRequest;
import ace.org.epms_backend.dto.continuous.OneOnOneMeetingResponse;
import ace.org.epms_backend.model.continuous.OneOnOneMeeting;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface OneOnOneMeetingMapper {

    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    OneOnOneMeeting toEntity(OneOnOneMeetingRequest request);

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.staffName", target = "managerName")
    OneOnOneMeetingResponse toResponse(OneOnOneMeeting meeting);

    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    void updateEntityFromRequest(OneOnOneMeetingRequest request, @MappingTarget OneOnOneMeeting meeting);
}
