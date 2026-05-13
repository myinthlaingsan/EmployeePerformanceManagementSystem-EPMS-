package ace.org.epms_backend.controller.appraisal;
import ace.org.epms_backend.dto.ApiResponse;
import ace.org.epms_backend.dto.appraisal.FinancialYearRequest;
import ace.org.epms_backend.dto.appraisal.FinancialYearResponse;
import ace.org.epms_backend.service.appraisal.FinancialYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/v1/financial-years")
@RequiredArgsConstructor
public class FinancialYearController {

    private final FinancialYearService financialYearService;

    @PostMapping
    public ResponseEntity<ApiResponse<FinancialYearResponse>> create(@Valid @RequestBody FinancialYearRequest request) {
        return ResponseEntity.ok(ApiResponse.success(financialYearService.createFinancialYear(request)));
    }


    @GetMapping
    public ResponseEntity<ApiResponse<List<FinancialYearResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(financialYearService.getAllFinancialYears()));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<FinancialYearResponse>> getCurrent() {
        return ResponseEntity.ok(ApiResponse.success(financialYearService.getCurrentFinancialYear()));
    }

    @PatchMapping("/{id}/set-current")
    public ResponseEntity<ApiResponse<FinancialYearResponse>> setCurrent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(financialYearService.setCurrentFinancialYear(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        financialYearService.deleteFinancialYear(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/rollover")
    public ResponseEntity<ApiResponse<FinancialYearResponse>> rollover() {
        return ResponseEntity.ok(ApiResponse.success(financialYearService.rollover()));
    }
}