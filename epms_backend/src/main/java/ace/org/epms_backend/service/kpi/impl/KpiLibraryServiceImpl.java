package ace.org.epms_backend.service.kpi.impl;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.KpiMapper;
import ace.org.epms_backend.model.kpi.KpiLibrary;
import ace.org.epms_backend.model.kpi.KpiLibraryDetails;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.repository.KpiLibraryRepository;
import ace.org.epms_backend.repository.PositionRepository;
import ace.org.epms_backend.service.kpi.KpiLibraryService;
import ace.org.epms_backend.util.excel.StyledKpiExcelParser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KpiLibraryServiceImpl implements KpiLibraryService {

    private final KpiLibraryRepository libraryRepository;
    private final PositionRepository positionRepository;
    private final KpiCategoryRepository categoryRepository;
    private final KpiMapper kpiMapper;
    private final StyledKpiExcelParser excelParser;

    @Override
    @Transactional
    public KpiLibraryResponse createLibrary(KpiLibraryRequest request) {
        validateLibraryWeights(request);

        if (request.getPositionId() == null) {
            throw new IllegalArgumentException("Position ID is required");
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

        // Explicitly save again to ensure details and relationships are persisted correctly (Enterprise safety)
        return kpiMapper.toLibraryResponse(libraryRepository.save(savedLibrary));
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
        validateLibraryWeights(request);

        if (request.getPositionId() == null) {
            throw new IllegalArgumentException("Position ID is required");
        }

        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));

        library.setTitle(request.getTitle());
        library.setDescription(request.getDescription());
        library.setPosition(positionRepository.findById(request.getPositionId())
                .orElseThrow(() -> new NotFoundException("Position not found")));

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
        return kpiMapper.toLibraryResponse(libraryRepository.save(savedLibrary));
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

    @Override
    @Transactional
    public KpiImportResult importLibraries(MultipartFile file) throws IOException {
        KpiParseResult parseResult = excelParser.parse(file);

        KpiImportResult result = KpiImportResult.builder()
                .totalSectionsFound(parseResult.getRequests().size() + parseResult.getErrors().size())
                .errors(new ArrayList<>(parseResult.getErrors())) // Start with parsing errors
                .failedImports(parseResult.getErrors().size())
                .build();

        if (parseResult.getRequests().isEmpty() && parseResult.getErrors().isEmpty()) {
            throw new IllegalArgumentException(
                    "No valid KPI scorecards detected in the file. Please ensure you are using the official scorecard template.");
        }

        for (KpiLibraryRequest request : parseResult.getRequests()) {
            try {
                // Soft Replace: Deactivate existing library with same title and position
                libraryRepository.findByTitleAndPositionPositionIdAndIsActiveTrue(
                        request.getTitle(), request.getPositionId())
                        .ifPresent(existing -> {
                            existing.setIsActive(false);
                            libraryRepository.save(existing);
                        });

                createLibrary(request);
                result.incrementSuccess();
            } catch (Exception e) {
                result.addError("Library '" + request.getTitle() + "': " + e.getMessage());
            }
        }

        return result;
    }
    
    @Override
    public List<KpiLibraryResponse> getLibraryHistory(Long positionId) {
        return libraryRepository.findByPositionPositionIdOrderByUpdatedAtDesc(positionId).stream()
                .map(kpiMapper::toLibraryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<KpiLibraryResponse> getAllLibraries() {
        return libraryRepository.findAll().stream()
                .map(kpiMapper::toLibraryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public KpiLibraryResponse toggleHistoryStatus(Long id, boolean active) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));

        if (active && library.getPosition() != null) {
            // Deactivate all other libraries for the same position
            List<KpiLibrary> positionLibraries = libraryRepository.findByPositionPositionIdOrderByUpdatedAtDesc(library.getPosition().getPositionId());
            for (KpiLibrary lib : positionLibraries) {
                if (!lib.getId().equals(id) && Boolean.TRUE.equals(lib.getIsActive())) {
                    lib.setIsActive(false);
                    libraryRepository.save(lib);
                }
            }
        }

        library.setIsActive(active);
        KpiLibrary updatedLibrary = libraryRepository.save(library);
        return kpiMapper.toLibraryResponse(updatedLibrary);
    }

    @Override
    @Transactional
    public void deleteLibrary(Long id) {
        KpiLibrary library = libraryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Library not found"));
        libraryRepository.delete(library);
    }

    private void validateLibraryWeights(KpiLibraryRequest request) {
        if (request.getDetails() == null || request.getDetails().isEmpty()) {
            throw new IllegalArgumentException("At least one KPI detail is required");
        }

        // Check for duplicate goal titles within the same library
        Set<String> titles = new HashSet<>();
        for (KpiLibraryDetailRequest detail : request.getDetails()) {
            if (!titles.add(detail.getGoalTitle().trim().toLowerCase())) {
                throw new IllegalArgumentException("Duplicate goal title found: " + detail.getGoalTitle());
            }
        }

        // Check individual item cap (35%)
        boolean anyItemExceedsCap = request.getDetails().stream()
                .anyMatch(d -> d.getWeightPercent().compareTo(new BigDecimal("35")) > 0);

        if (anyItemExceedsCap) {
            throw new IllegalArgumentException("Individual KPI weight cannot exceed 35%");
        }

        BigDecimal totalWeight = request.getDetails().stream()
                .map(KpiLibraryDetailRequest::getWeightPercent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Check total weight (100%) with rounding to handle Excel precision issues
        if (totalWeight.setScale(2, RoundingMode.HALF_UP).compareTo(new BigDecimal("100.00")) != 0) {
            throw new IllegalArgumentException("Total weight must be exactly 100% (Current: " + totalWeight + "%)");
        }
    }
}
