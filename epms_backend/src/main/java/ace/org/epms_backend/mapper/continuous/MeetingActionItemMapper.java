package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.MeetingActionItemResponse;
import ace.org.epms_backend.model.continuous.MeetingActionItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MeetingActionItemMapper {
    @org.mapstruct.Mapping(target = "assignedAt", source = "meeting.createdAt")
    MeetingActionItemResponse toResponse(MeetingActionItem item);
}
