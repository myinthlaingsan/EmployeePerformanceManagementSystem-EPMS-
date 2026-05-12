package ace.org.epms_backend.util.excel;

import ace.org.epms_backend.dto.kpi.KpiLibraryDetailRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
public class StyledKpiExcelParser {

    private final PositionRepository positionRepository;
    private final KpiCategoryRepository categoryRepository;

    public List<KpiLibraryRequest> parse(MultipartFile file) throws IOException {
        List<KpiLibraryRequest> requests = new ArrayList<>();
        Set<String> processedKeys = new HashSet<>(); // Title + PositionId to detect duplicates in file

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            KpiLibraryRequest currentLibrary = null;
            List<KpiLibraryDetailRequest> currentDetails = null;

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (isEmptyRow(row)) continue;

                String firstCellValue = getCellValueAsString(row.getCell(0), formatter, evaluator).trim();

                // 1. Detect KPI Library Title (e.g., "07-PS HEAD KPI")
                // Improved: Must end with KPI and not just be a header or random text
                if (isLibraryTitle(firstCellValue)) {
                    // Save previous library if "Total Score" was missing (Safety Fix)
                    if (currentLibrary != null && !currentDetails.isEmpty()) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }

                    currentLibrary = new KpiLibraryRequest();
                    currentLibrary.setTitle(firstCellValue);
                    currentLibrary.setPositionId(resolvePositionId(firstCellValue));
                    currentDetails = new ArrayList<>();
                    currentLibrary.setDetails(currentDetails);
                    continue;
                }

                // 2. Detect Header Row (Skip)
                // Improved: Check both first and second columns
                if (isHeaderRow(row, formatter, evaluator)) {
                    continue;
                }

                // 3. Detect Total Score Row (Finalize Section)
                if (isTotalScoreRow(row, formatter, evaluator)) {
                    if (currentLibrary != null && !currentDetails.isEmpty()) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }
                    currentLibrary = null;
                    currentDetails = null;
                    continue;
                }

                // 4. Parse KPI Detail Row
                if (currentLibrary != null && currentDetails != null) {
                    KpiLibraryDetailRequest detail = parseDetailRow(row, formatter, evaluator);
                    if (detail != null) {
                        currentDetails.add(detail);
                    }
                }
            }

            // Safety Fix: Capture the last library if file ended without "Total Score" row
            if (currentLibrary != null && !currentDetails.isEmpty()) {
                addRequestIfValid(requests, currentLibrary, processedKeys);
            }
        }

        return requests;
    }

    private void addRequestIfValid(List<KpiLibraryRequest> requests, KpiLibraryRequest request, Set<String> processedKeys) {
        String key = request.getTitle() + "|" + request.getPositionId();
        if (processedKeys.contains(key)) {
            return;
        }
        requests.add(request);
        processedKeys.add(key);
    }

    private boolean isLibraryTitle(String value) {
        // Improved Regex: Matches "XX-NAME KPI" or "NAME KPI" but not "KPI Summary" etc.
        return value.toUpperCase().endsWith("KPI") && !value.equalsIgnoreCase("KPI") 
                && !value.contains("SCORE") && !value.contains("SUMMARY");
    }

    private boolean isHeaderRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        String first = getCellValueAsString(row.getCell(0), formatter, evaluator).trim();
        String second = getCellValueAsString(row.getCell(1), formatter, evaluator).trim();
        return first.equalsIgnoreCase("KPI") && second.equalsIgnoreCase("Category");
    }

    private boolean isTotalScoreRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (Cell cell : row) {
            String value = getCellValueAsString(cell, formatter, evaluator).trim();
            if (value.equalsIgnoreCase("Total Score")) {
                return true;
            }
        }
        return false;
    }

    private Long resolvePositionId(String title) {
        String cleanTitle = title.replaceAll("(?i)KPI", "").trim();
        
        if (cleanTitle.contains("-")) {
            String[] parts = cleanTitle.split("-", 2);
            String code = parts[0].trim();
            String name = parts[1].trim();

            var posByCode = positionRepository.findByPositionCode(code);
            if (posByCode.isPresent()) return posByCode.get().getPositionId();

            var posByName = positionRepository.findByPositionNameIgnoreCase(name);
            if (posByName.isPresent()) return posByName.get().getPositionId();
        }

        return positionRepository.findByPositionNameIgnoreCase(cleanTitle)
                .orElseThrow(() -> new NotFoundException("Position not found for title: " + title))
                .getPositionId();
    }

    private KpiLibraryDetailRequest parseDetailRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        String goalTitle = getCellValueAsString(row.getCell(0), formatter, evaluator).trim();
        String categoryName = getCellValueAsString(row.getCell(1), formatter, evaluator).trim();
        String targetStr = getCellValueAsString(row.getCell(2), formatter, evaluator).trim();
        String unit = getCellValueAsString(row.getCell(3), formatter, evaluator).trim();
        String weightStr = getCellValueAsString(row.getCell(5), formatter, evaluator).trim();

        if (goalTitle.isEmpty()) return null;

        if (categoryName.isBlank()) {
            throw new IllegalArgumentException("Category is required for KPI: " + goalTitle);
        }

        KpiLibraryDetailRequest detail = new KpiLibraryDetailRequest();
        detail.setGoalTitle(goalTitle);
        detail.setUnit(unit);
        detail.setCategoryId(categoryRepository.findByNameIgnoreCase(categoryName)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categoryName))
                .getId());

        // Improved numeric parsing with explicit error handling
        detail.setTargetValue(parseBigDecimal(targetStr, "Target Value", goalTitle));
        detail.setWeightPercent(parseBigDecimal(weightStr, "Weight (%)", goalTitle));

        return detail;
    }

    private BigDecimal parseBigDecimal(String value, String fieldName, String kpiTitle) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required for KPI: " + kpiTitle);
        }
        try {
            // Remove % and non-numeric chars but keep decimal points and numbers
            String cleanValue = value.replace("%", "").replaceAll("[^0-9.-]", "").trim();
            if (cleanValue.isEmpty()) {
                throw new IllegalArgumentException("Invalid " + fieldName + ": '" + value + "' for KPI: " + kpiTitle);
            }
            return new BigDecimal(cleanValue);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse " + fieldName + " from value: '" + value + "' for KPI: " + kpiTitle);
        }
    }

    private String getCellValueAsString(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (cell == null) return "";
        // Best approach for Excel: DataFormatter + FormulaEvaluator
        if (cell.getCellType() == CellType.FORMULA) {
            return formatter.formatCellValue(cell, evaluator);
        }
        return formatter.formatCellValue(cell);
    }

    private boolean isEmptyRow(Row row) {
        if (row == null) return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) return false;
        }
        return true;
    }
}
