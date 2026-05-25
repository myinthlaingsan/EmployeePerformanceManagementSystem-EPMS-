package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.MeetingActionItemResponse;
import ace.org.epms_backend.model.continuous.MeetingActionItem;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MeetingActionItemMapper {
    @org.mapstruct.Mapping(source = "assignedTo.id", target = "assignedToId")
    @org.mapstruct.Mapping(source = "assignedTo.staffName", target = "assignedToName")
    MeetingActionItemResponse toResponse(MeetingActionItem item);
}
