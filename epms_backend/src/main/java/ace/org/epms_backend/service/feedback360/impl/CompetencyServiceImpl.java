package ace.org.epms_backend.service.feedback360.impl;

import ace.org.epms_backend.dto.feedback360.CompetencyRequest;
import ace.org.epms_backend.dto.feedback360.CompetencyResponse;
import ace.org.epms_backend.model.feedback360.Competency;
import ace.org.epms_backend.repository.feedback360.CompetencyRepository;
import ace.org.epms_backend.service.feedback360.CompetencyService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompetencyServiceImpl implements CompetencyService {

    private final CompetencyRepository competencyRepository;

    @Override
    public List<CompetencyResponse> getAllActive() {
        return competencyRepository.findByIsActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CompetencyResponse create(CompetencyRequest request) {
        Competency competency = Competency.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isActive(true)
                .build();
        return toResponse(competencyRepository.save(competency));
    }

    @Override
    @Transactional
    public CompetencyResponse update(Long id, CompetencyRequest request) {
        Competency competency = competencyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Competency not found: " + id));
        competency.setName(request.getName());
        competency.setDescription(request.getDescription());
        return toResponse(competencyRepository.save(competency));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Competency competency = competencyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Competency not found: " + id));
        // Soft delete — keeps the record for historical question references
        competency.setIsActive(false);
        competency.setIsDeleted(true);
        competencyRepository.save(competency);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private CompetencyResponse toResponse(Competency c) {
        return CompetencyResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .build();
    }
}
