package ace.org.epms_backend.service.feedback360;

import ace.org.epms_backend.model.employee.Employee;

import java.util.List;

/**
 * Evaluator Rotation Rule Service
 * <p>
 * Handles the fixed-mapping + rotation logic for Top Management (L01-L03) evaluating
 * Department Heads (L04). The rule ensures no evaluator reviews the same person in
 * two consecutive appraisal cycles. If all evaluators have been used, the system falls
 * back to a Round Robin (Least Recently Evaluated) strategy.
 */
public interface EvaluatorRotationService {

    /**
     * Assigns a valid Top Management evaluator (L01-L03) to a Department Head (L04) target
     * for the given appraisal cycle, applying the rotation rule.
     *
     * @param targetEmployeeId the ID of the L04 Department Head being evaluated
     * @param currentCycleId   the current appraisal cycle ID
     * @param previousCycleId  the immediately previous appraisal cycle ID (used for history check)
     * @return the selected {@link Employee} evaluator
     */
    Employee assignTopManagementEvaluator(Long targetEmployeeId, Long currentCycleId, Long previousCycleId);

    /**
     * Generates and saves FeedbackRequest records for ALL L04 Department Heads in the
     * given cycle, assigning Top Management evaluators using the rotation rule.
     *
     * @param currentCycleId  the current appraisal cycle ID
     * @param previousCycleId the immediately previous appraisal cycle ID
     */
    void generateTopManagementAssignments(Long currentCycleId, Long previousCycleId);

    /**
     * Returns all current Top Management (L01-L03) evaluator-to-L04 assignments for a cycle,
     * as a preview (without persisting).
     *
     * @param currentCycleId  the current appraisal cycle ID
     * @param previousCycleId the immediately previous appraisal cycle ID
     * @return list of {@link ace.org.epms_backend.dto.feedback360.EvaluatorAssignmentDTO}
     */
    List<ace.org.epms_backend.dto.feedback360.EvaluatorAssignmentDTO> previewTopManagementAssignments(
            Long currentCycleId, Long previousCycleId);
}
