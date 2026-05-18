package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.NominationProposalRequest;
import ace.org.epms_backend.dto.feedback360.NominationResponse;
import ace.org.epms_backend.enums.NominationStatus;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.feedback360.FeedbackNomination;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackNominationRepository;
import ace.org.epms_backend.service.feedback360.FeedbackNominationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackNominationServiceImpl implements FeedbackNominationService {

    private final FeedbackNominationRepository nominationRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public NominationResponse propose(Long nominatedById, NominationProposalRequest request) {
        Employee targetUser = employeeRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + request.getTargetUserId()));
        Employee nominee = employeeRepository.findById(request.getNomineeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + request.getNomineeId()));
        Employee nominatedBy = employeeRepository.findById(nominatedById)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + nominatedById));

        FeedbackNomination nomination = FeedbackNomination.builder()
                .targetUser(targetUser)
                .nominee(nominee)
                .relationship(request.getRelationship())
                .nominatedBy(nominatedBy)
                .status(NominationStatus.PROPOSED)
                .build();

        return toResponse(nominationRepository.save(nomination));
    }

    @Override
    public List<NominationResponse> getMyNominations(Long nominatedById) {
        return nominationRepository.findByNominatedById(nominatedById).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NominationResponse approve(Long nominationId, Long approverId) {
        FeedbackNomination nomination = findOrThrow(nominationId);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + approverId));
        nomination.setStatus(NominationStatus.APPROVED);
        nomination.setApprovedBy(approver);
        return toResponse(nominationRepository.save(nomination));
    }

    @Override
    @Transactional
    public NominationResponse reject(Long nominationId, Long approverId) {
        FeedbackNomination nomination = findOrThrow(nominationId);
        Employee approver = employeeRepository.findById(approverId)
                .orElseThrow(() -> new NotFoundException("Employee not found: " + approverId));
        nomination.setStatus(NominationStatus.REJECTED);
        nomination.setApprovedBy(approver);
        return toResponse(nominationRepository.save(nomination));
    }

    private FeedbackNomination findOrThrow(Long id) {
        return nominationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nomination not found: " + id));
    }

    private NominationResponse toResponse(FeedbackNomination n) {
        return NominationResponse.builder()
                .id(n.getId())
                .targetUserId(n.getTargetUser().getId())
                .targetUserName(n.getTargetUser().getStaffName())
                .nomineeId(n.getNominee().getId())
                .nomineeName(n.getNominee().getStaffName())
                .relationship(n.getRelationship())
                .status(n.getStatus())
                .nominatedById(n.getNominatedBy().getId())
                .approvedById(n.getApprovedBy() != null ? n.getApprovedBy().getId() : null)
                .build();
    }
}
