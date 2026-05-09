package ace.org.epms_backend.controller.appraisal;

import ace.org.epms_backend.dto.appraisal.FinancialYearRequest;
import ace.org.epms_backend.dto.appraisal.FinancialYearResponse;
import ace.org.epms_backend.service.appraisal.FinancialYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/financial-years")
@RequiredArgsConstructor
public class FinancialYearController {

    private final FinancialYearService financialYearService;

    @PostMapping
    public ResponseEntity<FinancialYearResponse> create(@RequestBody FinancialYearRequest request) {
        return ResponseEntity.ok(financialYearService.createFinancialYear(request));
    }

    @GetMapping
    public ResponseEntity<List<FinancialYearResponse>> getAll() {
        return ResponseEntity.ok(financialYearService.getAllFinancialYears());
    }

    @GetMapping("/current")
    public ResponseEntity<FinancialYearResponse> getCurrent() {
        return ResponseEntity.ok(financialYearService.getCurrentFinancialYear());
    }

    @PatchMapping("/{id}/set-current")
    public ResponseEntity<FinancialYearResponse> setCurrent(@PathVariable Long id) {
        return ResponseEntity.ok(financialYearService.setCurrentFinancialYear(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        financialYearService.deleteFinancialYear(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rollover")
    public ResponseEntity<FinancialYearResponse> rollover() {
        return ResponseEntity.ok(financialYearService.rollover());
    }
}
