package ace.org.epms_backend.service.impl.appraisal;

import ace.org.epms_backend.dto.appraisal.FinancialYearRequest;
import ace.org.epms_backend.dto.appraisal.FinancialYearResponse;
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
        if (request.isCurrent()) {
            resetCurrentFlags();
        }

        FinancialYear fy = FinancialYear.builder()
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isCurrent(request.isCurrent())
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
        financialYearRepository.deleteById(id);
    }

    @Override
    @Transactional
    public FinancialYearResponse setCurrentFinancialYear(Long id) {
        resetCurrentFlags();
        FinancialYear fy = financialYearRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Financial Year not found"));
        fy.setCurrent(true);
        return mapToResponse(financialYearRepository.save(fy));
    }

    @Override
    @Transactional
    public FinancialYearResponse rollover() {
        FinancialYear current = financialYearRepository.findByIsCurrentTrue()
                .orElseThrow(() -> new RuntimeException("No current active financial year found"));

        if (!appraisalCycleRepository.findByIsActiveTrue().isEmpty()) {
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
                .build();

        return mapToResponse(financialYearRepository.save(nextYear));
    }

    private void resetCurrentFlags() {
        List<FinancialYear> all = financialYearRepository.findAll();
        all.forEach(f -> f.setCurrent(false));
        financialYearRepository.saveAll(all);
    }

    private FinancialYearResponse mapToResponse(FinancialYear fy) {
        return FinancialYearResponse.builder()
                .id(fy.getId())
                .title(fy.getTitle())
                .startDate(fy.getStartDate())
                .endDate(fy.getEndDate())
                .isCurrent(fy.isCurrent())
                .build();
    }
}
