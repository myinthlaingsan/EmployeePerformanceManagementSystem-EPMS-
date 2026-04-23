package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.feedback360.FeedbackRequestResponse;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    @Mapping(target = "targetUserName", source = "targetUser.staffName")
    @Mapping(target = "cycleName", source = "cycle.cycleName")
    FeedbackRequestResponse toRequestResponse(FeedbackRequest request);
}