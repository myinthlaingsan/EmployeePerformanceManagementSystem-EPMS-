package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.FeedbackReplyRequest;
import ace.org.epms_backend.dto.continuous.FeedbackReplyResponse;
import ace.org.epms_backend.model.continuous.FeedbackReply;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FeedbackReplyMapper {

    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "feedback", ignore = true)
    FeedbackReply toEntity(FeedbackReplyRequest request);

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "feedback.feedbackId", target = "feedbackId")
    FeedbackReplyResponse toResponse(FeedbackReply reply);
}
