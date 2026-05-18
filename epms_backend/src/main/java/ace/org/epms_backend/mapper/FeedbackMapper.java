package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.feedback360.*;
import ace.org.epms_backend.model.feedback360.*;
import ace.org.epms_backend.enums.FeedbackRelationship;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    @Mapping(target = "targetUserId", source = "targetUser.id")
    @Mapping(target = "targetUserName", source = "targetUser.staffName")
    @Mapping(target = "evaluatorId", source = "evaluator.id")
    @Mapping(target = "evaluatorName", source = "evaluator.staffName")
    @Mapping(target = "cycleId", source = "cycle.cycleId")
    @Mapping(target = "formTemplateId", source = "assignedForm.formId")
    @Mapping(target = "formId", source = "assignedForm.formId")
    @Mapping(target = "targetLevelCode", source = "targetUser.level.levelCode")
    @Mapping(target = "evaluatorLevelCode", source = "evaluator.level.levelCode")
    @Mapping(target = "relationship", expression = "java(request.getRelationship() != null ? request.getRelationship().toEvaluatorPerspective() : null)")
    @Mapping(target = "targetDepartmentName", ignore = true)
    @Mapping(target = "evaluatorDepartmentName", ignore = true)
    @Mapping(target = "isReciprocalFallback", ignore = true)
    FeedbackRequestResponse toRequestResponse(FeedbackRequest request);

    @Mapping(target = "requestId", source = "request.id")
    @Mapping(target = "targetUserId", source = "request.targetUser.id")
    @Mapping(target = "targetUserName", source = "request.targetUser.staffName")
    @Mapping(target = "evaluatorId", source = "request.evaluator.id")
    @Mapping(target = "evaluatorName", source = "request.evaluator.staffName")
    @Mapping(target = "relationship", expression = "java(feedback.getRequest() != null && feedback.getRequest().getRelationship() != null ? feedback.getRequest().getRelationship().toEvaluatorPerspective().name() : null)")
    @Mapping(target = "submittedAt", source = "submittedAt")
    @Mapping(target = "feedbackId", source = "id")
    FeedbackDetailsResponse toFeedbackDetails(Feedback feedback);

    @Mapping(target = "questionId", source = "question.questionId")
    @Mapping(target = "questionText", source = "question.questionText")
    FeedbackResponseDetails toResponseDetails(FeedbackResponse response);

    @Mapping(target = "targetUserId", source = "employee.id")
    @Mapping(target = "targetUserName", source = "employee.staffName")
    @Mapping(target = "cycleName", source = "cycle.cycleName")
    @Mapping(target = "summaryId", source = "id")
    FeedbackSummaryResponse toSummaryResponse(FeedbackSummary summary);
}
