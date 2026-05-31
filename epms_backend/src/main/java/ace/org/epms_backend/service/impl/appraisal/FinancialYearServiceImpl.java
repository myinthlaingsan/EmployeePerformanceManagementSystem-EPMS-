package ace.org.epms_backend.service.impl.appraisal;

import ace.org.epms_backend.dto.appraisal.FinancialYearRequest;
import ace.org.epms_backend.dto.appraisal.FinancialYearResponse;
import ace.org.epms_backend.enums.FinancialYearStatus;
import ace.org.epms_backend.exception.InvalidStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.appraisal.FinancialYear;
import ace.org.epms_backend.repository.appraisal.FinancialYearRepository;
import ace.org.epms_backend.service.appraisal.FinancialYearService;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinancialYearServiceImpl implements FinancialYearService {

    private final FinancialYearRepository financialYearRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;

    @Override
    @Transactional
    public FinancialYearResponse createFinancialYear(FinancialYearRequest request) {
        FinancialYear fy = FinancialYear.builder()
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isCurrent(false)
                .status(FinancialYearStatus.NOT_USED)
                .build();

        FinancialYear saved = financialYearRepository.save(fy);
        return mapToResponse(saved);
    }

    @Override
    public List<FinancialYearResponse> getAllFinancialYears() {
        return financialYearRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FinancialYearResponse getCurrentFinancialYear() {
        return financialYearRepository.findByIsCurrentTrue()
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional
    public void deleteFinancialYear(Long id) {
        FinancialYear fy = financialYearRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Financial Year not found"));

        FinancialYearStatus status = resolveStatus(fy);
        if (status != FinancialYearStatus.NOT_USED) {
            throw new InvalidStateException("Only not-used financial years can be deleted.");
        }

        financialYearRepository.delete(fy);
    }

    @Override
    @Transactional
    public FinancialYearResponse setCurrentFinancialYear(Long id) {
        FinancialYear fy = financialYearRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Financial Year not found"));

        if (resolveStatus(fy) != FinancialYearStatus.NOT_USED) {
            throw new InvalidStateException("Only not-used financial years can be activated.");
        }

        financialYearRepository.findByIsCurrentTrue()
                .filter(current -> !current.getId().equals(id))
                .ifPresent(current -> {
                    throw new InvalidStateException("Deactivate the current financial year before activating another one.");
                });

        fy.setCurrent(true);
        fy.setStatus(FinancialYearStatus.CURRENT);
        return mapToResponse(financialYearRepository.save(fy));
    }

    @Override
    @Transactional
    public FinancialYearResponse deactivateFinancialYear(Long id) {
        FinancialYear fy = financialYearRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Financial Year not found"));

        if (resolveStatus(fy) != FinancialYearStatus.CURRENT) {
            throw new InvalidStateException("Only the current financial year can be deactivated.");
        }

        long activeCycleCount = appraisalCycleRepository.countByFinancialYear_IdAndIsActiveTrue(id);
        if (activeCycleCount > 0) {
            throw new IllegalArgumentException(
                    "This financial year has an active appraisal cycle. Finalize the active appraisal cycle related to this year before deactivating it.");
        }

        fy.setCurrent(false);
        fy.setStatus(FinancialYearStatus.HISTORICAL);
        return mapToResponse(financialYearRepository.save(fy));
    }

    @Override
    @Transactional
    public FinancialYearResponse rollover() {
        FinancialYear current = financialYearRepository.findByIsCurrentTrue()
                .orElseThrow(() -> new RuntimeException("No current active financial year found"));

        if (!appraisalCycleRepository.findByIsActiveTrueOrderByCycleIdDesc().isEmpty()) {
            throw new RuntimeException("Cannot rollover. There are active appraisal cycles.");
        }

        resetCurrentFlags();

        int startYear = current.getStartDate().getYear() + 1;
        int endYear = startYear + 1;
        String title = "FY " + startYear + "-" + endYear;

        FinancialYear nextYear = FinancialYear.builder()
                .title(title)
                .startDate(current.getStartDate().plusYears(1))
                .endDate(current.getEndDate().plusYears(1))
                .isCurrent(true)
                .status(FinancialYearStatus.CURRENT)
                .build();

        return mapToResponse(financialYearRepository.save(nextYear));
    }

    private void resetCurrentFlags() {
        List<FinancialYear> all = financialYearRepository.findAll();
        all.forEach(f -> {
            f.setCurrent(false);
            f.setStatus(FinancialYearStatus.HISTORICAL);
        });
        financialYearRepository.saveAll(all);
    }

    private FinancialYearStatus resolveStatus(FinancialYear fy) {
        if (fy.getStatus() != null) {
            return fy.getStatus();
        }
        return fy.isCurrent() ? FinancialYearStatus.CURRENT : FinancialYearStatus.NOT_USED;
    }

    private FinancialYearResponse mapToResponse(FinancialYear fy) {
        FinancialYearStatus status = resolveStatus(fy);
        return FinancialYearResponse.builder()
                .id(fy.getId())
                .title(fy.getTitle())
                .startDate(fy.getStartDate())
                .endDate(fy.getEndDate())
                .status(status)
                .isCurrent(status == FinancialYearStatus.CURRENT)
                .build();
    }
}
