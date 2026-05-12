package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.kpi.KpiLibraryDetailRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.kpi.KpiLibrary;
import ace.org.epms_backend.model.kpi.KpiLibraryDetails;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.repository.KpiLibraryRepository;
import ace.org.epms_backend.repository.PositionRepository;
import ace.org.epms_backend.service.kpi.KpiLibraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiLibraryServiceImpl implements KpiLibraryService {

    private final KpiLibraryRepository libraryRepository;
    private final PositionRepository positionRepository;
    private final KpiCategoryRepository categoryRepository;
    private final KpiMapper kpiMapper;

    @Override
    @Transactional
    public KpiLibraryResponse createLibrary(KpiLibraryRequest request) {
        // Check individual item cap (35%)
        boolean anyItemExceedsCap = request.getDetails().stream()
                .anyMatch(d -> d.getWeightPercent().compareTo(new BigDecimal("35")) > 0);

        if (anyItemExceedsCap) {
            throw new IllegalArgumentException("Individual KPI weight cannot exceed 35%");
        }

        BigDecimal totalWeight = request.getDetails().stream()
                .map(KpiLibraryDetailRequest::getWeightPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Check total weight (100%)
        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must be exactly 100%");
        }

        KpiLibrary library = kpiMapper.toLibraryEntity(request);
        library.setPosition(positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new NotFoundException("Position not found")));

        KpiLibrary savedLibrary = libraryRepository.save(library);

        List<KpiLibraryDetails> details = request.getDetails().stream().map(d -> {
            if (d.getCategoryId() == null) {
                throw new IllegalArgumentException("Category ID is required");
            }
            KpiLibraryDetails detail = kpiMapper.toLibraryDetailEntity(d);
            detail.setLibrary(savedLibrary);
            detail.setCategory(categoryRepository.findById(d.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Category not found")));
            return detail;
        }).collect(Collectors.toList());

        savedLibrary.setDetails(details);

        return kpiMapper.toLibraryResponse(savedLibrary);
    }

    @Override
    public List<KpiLibraryResponse> getAllActiveLibraries() {
        return libraryRepository.findByIsActiveTrue().stream()
                .map(kpiMapper::toLibraryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public KpiLibraryResponse toggleLibraryStatus(Long id, boolean status) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));
        library.setIsActive(status);
        KpiLibrary updatedLibrary = libraryRepository.save(library);
        return kpiMapper.toLibraryResponse(updatedLibrary);
    }

    @Override
    public KpiLibraryResponse getLibraryById(Long id) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));
        KpiLibraryResponse response = kpiMapper.toLibraryResponse(library);
        if (library.getPosition() != null) {
            response.setPositionId(library.getPosition().getPositionId());
        }
        return response;
    }

    @Override
    @Transactional
    public KpiLibraryResponse updateLibrary(Long id, KpiLibraryRequest request) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));

        library.setTitle(request.getTitle());
        library.setDescription(request.getDescription());
        if (request.getPositionId() != null) {
            library.setPosition(positionRepository.findById(request.getPositionId())
                    .orElseThrow(() -> new NotFoundException("Position not found")));
        }

        // Sync details (clear and add new)
        library.getDetails().clear();
        List<KpiLibraryDetails> details = request.getDetails().stream().map(d -> {
            KpiLibraryDetails detail = kpiMapper.toLibraryDetailEntity(d);
            detail.setLibrary(library);
            detail.setCategory(categoryRepository.findById(d.getCategoryId())
                    .orElseThrow(() -> new NotFoundException("Category not found")));
            return detail;
        }).collect(Collectors.toList());
        library.getDetails().addAll(details);

        KpiLibrary savedLibrary = libraryRepository.save(library);
        return kpiMapper.toLibraryResponse(savedLibrary);
    }

    @Override
    @Transactional
    public KpiLibraryResponse cloneLibrary(Long id, String newTitle) {
        KpiLibrary source = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));

        KpiLibrary cloned = KpiLibrary.builder()
                .title(newTitle)
                .description(source.getDescription())
                .position(source.getPosition())
                .isActive(true)
                .build();

        KpiLibrary savedLibrary = libraryRepository.save(cloned);

        List<KpiLibraryDetails> clonedDetails = source.getDetails().stream().map(d -> {
            return KpiLibraryDetails.builder()
                    .library(savedLibrary)
                    .goalTitle(d.getGoalTitle())
                    .targetValue(d.getTargetValue())
                    .weightPercent(d.getWeightPercent())
                    .category(d.getCategory())
                    .build();
        }).collect(Collectors.toList());

        savedLibrary.setDetails(clonedDetails);
        return kpiMapper.toLibraryResponse(savedLibrary);
    }

    @Override
    public PagedResponse<KpiLibraryResponse> searchLibraries(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<KpiLibrary> libraryPage = libraryRepository.findByTitleContainingIgnoreCase(keyword, pageable);
        Page<KpiLibraryResponse> responsePage = libraryPage.map(kpiMapper::toLibraryResponse);
        return new PagedResponse<>(
                responsePage.getContent(),
                responsePage.getNumber(),
                responsePage.getSize(),
                responsePage.getTotalElements(),
                responsePage.getTotalPages(),
                responsePage.isLast());
    }
}
