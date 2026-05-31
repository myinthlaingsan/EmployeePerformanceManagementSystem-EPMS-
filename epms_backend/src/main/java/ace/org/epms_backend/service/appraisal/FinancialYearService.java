package ace.org.epms_backend.service.appraisal;

import ace.org.epms_backend.dto.appraisal.FinancialYearRequest;
import ace.org.epms_backend.dto.appraisal.FinancialYearResponse;

import java.util.List;

public interface FinancialYearService {
    FinancialYearResponse createFinancialYear(FinancialYearRequest request);
    List<FinancialYearResponse> getAllFinancialYears();
    FinancialYearResponse getCurrentFinancialYear();
    void deleteFinancialYear(Long id);
    FinancialYearResponse setCurrentFinancialYear(Long id);
    FinancialYearResponse deactivateFinancialYear(Long id);
    FinancialYearResponse rollover();
}
