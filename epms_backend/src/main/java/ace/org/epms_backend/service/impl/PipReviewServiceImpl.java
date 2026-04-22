package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.pip.PipReviewRequest;
import ace.org.epms_backend.dto.pip.PipReviewResponse;
import ace.org.epms_backend.enums.PipOutcome;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.exception.UserNotFoundException;
import ace.org.epms_backend.mapper.PipReviewMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.model.pip.PipReview;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.PipRecordRepository;
import ace.org.epms_backend.repository.PipReviewRepository;
import ace.org.epms_backend.service.PipReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipReviewServiceImpl implements PipReviewService {

    private final PipReviewRepository reviewRepository;
    private final PipRecordRepository pipRepository;
    private final EmployeeRepository employeeRepository;
    private final PipReviewMapper mapper;

    // =========================
    // CREATE REVIEW (HR / MANAGER)
    // =========================
    @Override
    public PipReviewResponse createReview(PipReviewRequest request) {

        Employee current = getCurrentUser();

        PipRecord pip = pipRepository.findById(request.getPipId())
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        if (pip.getStatus() != PipStatus.ACTIVE) {
            throw new RuntimeException("Reviews can only be created for ACTIVE PIP");
        }

        // 🔐 ONLY HR OR ASSIGNED MANAGER CAN CREATE REVIEW
        if (!isHR(current) &&
                !pip.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not allowed to review this PIP");
        }

        PipReview review = mapper.toEntity(request);
        review.setPip(pip);
        review.setCreatedBy(current.getId());

        return mapper.toResponse(reviewRepository.save(review));
    }

    // =========================
    // GET REVIEWS (ALL INVOLVED USERS)
    // =========================
    @Override
    public List<PipReviewResponse> getReviewsByPip(Long pipId) {

        Employee current = getCurrentUser();

        PipRecord pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        // 🔐 EMPLOYEE can only see own PIP
        if (isEmployee(current) &&
                !pip.getEmployee().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not allowed to view this PIP");
        }

        // 🔐 MANAGER can only see assigned PIP
        if (isManager(current) &&
                !pip.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not your assigned PIP");
        }

        return reviewRepository.findByPip_PipId(pipId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    // =========================
    // FINALIZE PIP (HR / MANAGER)
    // =========================
    @Override
    public void finalizePip(Long pipId, PipOutcome outcome, String comment) {

        Employee current = getCurrentUser();

        PipRecord pip = pipRepository.findById(pipId)
                .orElseThrow(() -> new RuntimeException("PIP not found"));

        // 🔐 ONLY HR OR ASSIGNED MANAGER
        if (!isHR(current) &&
                !pip.getManager().getId().equals(current.getId())) {
            throw new AccessDeniedException("Not allowed to finalize this PIP");
        }

        pip.setFinalOutcome(outcome);
        pip.setOverallComment(comment);
        pip.setStatus(PipStatus.CLOSED);

        pipRepository.save(pip);
    }

    // =========================
    // HELPER METHODS
    // =========================
    private Employee getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        return employeeRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new UserNotFoundException("User not found"));
    }

    private boolean isHR(Employee emp) {
        return hasRole("HR");
    }

    private boolean isManager(Employee emp) {
        return hasRole("MANAGER");
    }

    private boolean isEmployee(Employee emp) {
        return hasRole("EMPLOYEE");
    }

    private boolean hasRole(String role) {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}