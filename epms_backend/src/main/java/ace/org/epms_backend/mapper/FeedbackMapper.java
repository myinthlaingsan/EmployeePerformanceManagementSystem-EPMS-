package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.feedback360.*;
import ace.org.epms_backend.model.feedback360.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    @Mapping(target = "targetUserId", source = "targetUser.id")
    @Mapping(target = "targetUserName", source = "targetUser.staffName")
    @Mapping(target = "evaluatorId", source = "evaluator.id")
    @Mapping(target = "evaluatorName", source = "evaluator.staffName")
    @Mapping(target = "cycleId", source = "cycle.cycleId")
    FeedbackRequestResponse toRequestResponse(FeedbackRequest request);

    @Mapping(target = "requestId", source = "request.id")
    FeedbackDetailsResponse toFeedbackDetails(Feedback feedback);

    @Mapping(target = "questionId", source = "question.questionId")
    @Mapping(target = "questionText", source = "question.questionText")
    FeedbackResponseDetails toResponseDetails(FeedbackResponse response);

    @Mapping(target = "targetUserId", source = "employee.id")
    @Mapping(target = "targetUserName", source = "employee.staffName")
    @Mapping(target = "cycleName", source = "cycle.cycleName")
    FeedbackSummaryResponse toSummaryResponse(FeedbackSummary summary);
}