package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.MeetingCommentRequest;
import ace.org.epms_backend.dto.continuous.MeetingCommentResponse;
import ace.org.epms_backend.model.continuous.MeetingComment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MeetingCommentMapper {

    @Mapping(target = "meeting", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    MeetingComment toEntity(MeetingCommentRequest request);

    @Mapping(source = "meeting.meetingId", target = "meetingId")
    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.staffName", target = "managerName")
    MeetingCommentResponse toResponse(MeetingComment comment);
}
