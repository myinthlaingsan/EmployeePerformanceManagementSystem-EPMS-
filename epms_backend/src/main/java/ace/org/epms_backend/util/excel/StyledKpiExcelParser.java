package ace.org.epms_backend.util.excel;

import ace.org.epms_backend.dto.kpi.KpiLibraryDetailRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.exception.BulkImportValidationException;
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

    private static final String HEADER_KPI      = "KPI";
    private static final String HEADER_CATEGORY = "CATEGORY";
    private static final String HEADER_TARGET   = "TARGET";
    private static final String HEADER_UNIT     = "UNIT";
    private static final String HEADER_WEIGHT   = "WEIGHT";

    public List<KpiLibraryRequest> parse(MultipartFile file) throws IOException {
        List<KpiLibraryRequest> requests      = new ArrayList<>();
        List<String>            errors        = new ArrayList<>();
        Set<String>             processedKeys = new HashSet<>();
        Map<String, Integer>    columnMap     = new HashMap<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            FormulaEvaluator evaluator   = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter    formatter   = new DataFormatter();
            Sheet            sheet       = workbook.getSheetAt(0);
            Iterator<Row>    rowIterator = sheet.iterator();

            KpiLibraryRequest             currentLibrary = null;
            List<KpiLibraryDetailRequest> currentDetails = null;
            boolean                       positionValid  = false;

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (isEmptyRow(row, formatter, evaluator)) continue;

                // 1. Detect KPI Library Title
                String libraryTitle = findLibraryTitle(row, formatter, evaluator);
                if (libraryTitle != null) {
                    // Finalise previous section if valid
                    if (currentLibrary != null && currentDetails != null
                            && !currentDetails.isEmpty() && positionValid) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }

                    columnMap.clear();
                    currentLibrary = new KpiLibraryRequest();
                    currentLibrary.setTitle(libraryTitle);
                    currentDetails = new ArrayList<>();
                    currentLibrary.setDetails(currentDetails);

                    // Resolve position — collect error instead of throwing
                    Long positionId = resolvePositionId(libraryTitle, errors);
                    positionValid = positionId != null;
                    currentLibrary.setPositionId(positionId);
                    continue;
                }

                // 2. Detect Header Row
                if (columnMap.isEmpty() && buildColumnMap(row, formatter, evaluator, columnMap)) {
                    continue;
                }

                // 3. Detect Total Score Row — finalise section
                if (isTotalScoreRow(row, formatter, evaluator)) {
                    if (currentLibrary != null && currentDetails != null
                            && !currentDetails.isEmpty() && positionValid) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }
                    currentLibrary = null;
                    currentDetails = null;
                    positionValid  = false;
                    continue;
                }

                // 4. Parse KPI Detail Row
                if (currentLibrary != null && currentDetails != null && !columnMap.isEmpty()) {
                    KpiLibraryDetailRequest detail =
                            parseDetailRow(row, formatter, evaluator, columnMap, errors);
                    // Only add to section if position is valid — avoids polluting a broken section
                    if (detail != null && positionValid) {
                        currentDetails.add(detail);
                    }
                }
            }

            // Final fallback — last section without a Total Score row
            if (currentLibrary != null && currentDetails != null
                    && !currentDetails.isEmpty() && positionValid) {
                addRequestIfValid(requests, currentLibrary, processedKeys);
            }
        }

        // Throw all collected errors at once — nothing is saved to DB
        if (!errors.isEmpty()) {
            throw new BulkImportValidationException(errors);
        }

        if (requests.isEmpty()) {
            throw new BulkImportValidationException(
                List.of("No valid KPI scorecards detected in the file. " +
                        "Please ensure you are using the official scorecard template.")
            );
        }

        return requests;
    }

    // -------------------------------------------------------------------------
    // Section detection
    // -------------------------------------------------------------------------

    private String findLibraryTitle(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (Cell cell : row) {
            String value = getCellValueAsString(cell, formatter, evaluator).trim();
            if (isLibraryTitle(value)) return value;
        }
        return null;
    }

    private boolean isLibraryTitle(String value) {
        String upper = value.toUpperCase().trim();
        return upper.matches("^(\\d{2}-)?[A-Z0-9\\s/&()-]+\\sKPI$")
                && !upper.equals("KPI")
                && !upper.contains("TOTAL SCORE")
                && !upper.contains("SUMMARY");
    }

    private boolean buildColumnMap(Row row, DataFormatter formatter, FormulaEvaluator evaluator,
                                   Map<String, Integer> columnMap) {
        Map<String, Integer> tempMap = new HashMap<>();
        for (Cell cell : row) {
            String value = getCellValueAsString(cell, formatter, evaluator).trim().toUpperCase();
            if (value.equals("KPI"))             tempMap.put(HEADER_KPI,      cell.getColumnIndex());
            else if (value.contains("CATEGORY")) tempMap.put(HEADER_CATEGORY, cell.getColumnIndex());
            else if (value.contains("TARGET"))   tempMap.put(HEADER_TARGET,   cell.getColumnIndex());
            else if (value.contains("UNIT"))     tempMap.put(HEADER_UNIT,     cell.getColumnIndex());
            else if (value.contains("WEIGHT"))   tempMap.put(HEADER_WEIGHT,   cell.getColumnIndex());
        }
        if (tempMap.containsKey(HEADER_KPI) && tempMap.containsKey(HEADER_CATEGORY)) {
            columnMap.putAll(tempMap);
            return true;
        }
        return false;
    }

    private boolean isTotalScoreRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (Cell cell : row) {
            if (getCellValueAsString(cell, formatter, evaluator).trim()
                    .equalsIgnoreCase("Total Score")) return true;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Position resolution — returns null and appends to errors instead of throwing
    // -------------------------------------------------------------------------

    private Long resolvePositionId(String title, List<String> errors) {
        String cleanTitle = title.replaceAll("(?i)\\s*KPI\\s*$", "").trim();

        if (cleanTitle.contains("-")) {
            String[] parts = cleanTitle.split("-", 2);
            String   code  = parts[0].trim();
            String   name  = parts[1].trim();

            var byCode = positionRepository.findByPositionCode(code);
            if (byCode.isPresent()) return byCode.get().getPositionId();

            var byName = positionRepository.findByPositionNameIgnoreCase(name);
            if (byName.isPresent()) return byName.get().getPositionId();
        } else {
            var byName = positionRepository.findByPositionNameIgnoreCase(cleanTitle);
            if (byName.isPresent()) return byName.get().getPositionId();
        }

        errors.add("Position not found for title: \"" + title + "\". " +
                   "Ensure the position code or name exists in the system.");
        return null;
    }

    // -------------------------------------------------------------------------
    // Detail row parsing — accumulates errors instead of throwing
    // -------------------------------------------------------------------------

    private KpiLibraryDetailRequest parseDetailRow(Row row, DataFormatter formatter,
                                                   FormulaEvaluator evaluator,
                                                   Map<String, Integer> columnMap,
                                                   List<String> errors) {
        String goalTitle    = getValue(row, columnMap, HEADER_KPI,      formatter, evaluator);
        String categoryName = getValue(row, columnMap, HEADER_CATEGORY, formatter, evaluator);
        String targetStr    = getValue(row, columnMap, HEADER_TARGET,   formatter, evaluator);
        String unit         = getValue(row, columnMap, HEADER_UNIT,     formatter, evaluator);
        String weightStr    = getValue(row, columnMap, HEADER_WEIGHT,   formatter, evaluator);

        if (goalTitle.isBlank()) return null;

        int     rowNum   = row.getRowNum() + 1;
        boolean rowValid = true;

        // Category — required, must exist in DB
        Long categoryId = null;
        if (categoryName.isBlank()) {
            errors.add("Row " + rowNum + ": Category is required for KPI: \"" + goalTitle + "\".");
            rowValid = false;
        } else {
            var cat = categoryRepository.findByNameIgnoreCase(categoryName);
            if (cat.isEmpty()) {
                errors.add("Row " + rowNum + ": Category not found: \"" + categoryName +
                           "\" for KPI: \"" + goalTitle + "\". Add it in Category Management first.");
                rowValid = false;
            } else {
                categoryId = cat.get().getId();
            }
        }

        // Weight — required numeric
        BigDecimal weightPercent =
                parseRequiredBigDecimal(weightStr, "Weight (%)", goalTitle, rowNum, errors);
        if (weightPercent == null) rowValid = false;

        // Target — optional
        BigDecimal targetValue =
                parseOptionalBigDecimal(targetStr, "Target Value", goalTitle, rowNum, errors);

        if (!rowValid) return null;

        KpiLibraryDetailRequest detail = new KpiLibraryDetailRequest();
        detail.setGoalTitle(goalTitle);
        detail.setUnit(unit.isBlank() ? null : unit);
        detail.setCategoryId(categoryId);
        detail.setTargetValue(targetValue);
        detail.setWeightPercent(weightPercent);
        return detail;
    }

    // -------------------------------------------------------------------------
    // Numeric parsing
    // -------------------------------------------------------------------------

    /** Required field — appends error and returns null if blank or non-numeric. */
    private BigDecimal parseRequiredBigDecimal(String value, String fieldName,
                                               String kpiTitle, int rowNum,
                                               List<String> errors) {
        if (value == null || value.isBlank()) {
            errors.add("Row " + rowNum + ": " + fieldName +
                       " is required for KPI: \"" + kpiTitle + "\".");
            return null;
        }
        String clean = value.replace("%", "").replace(",", "").trim();
        try {
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            errors.add("Row " + rowNum + ": Invalid " + fieldName + " value \"" + value +
                       "\" for KPI: \"" + kpiTitle + "\". Must be a valid number.");
            return null;
        }
    }

    /** Optional field — returns null silently if blank; appends error only if present but non-numeric. */
    private BigDecimal parseOptionalBigDecimal(String value, String fieldName,
                                               String kpiTitle, int rowNum,
                                               List<String> errors) {
        if (value == null || value.isBlank()) return null;
        String clean = value.replace("%", "").replace(",", "").trim();
        try {
            return new BigDecimal(clean);
        } catch (NumberFormatException e) {
            errors.add("Row " + rowNum + ": Invalid " + fieldName + " value \"" + value +
                       "\" for KPI: \"" + kpiTitle + "\". Must be a valid number or left blank.");
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Cell / row utilities
    // -------------------------------------------------------------------------

    private String getValue(Row row, Map<String, Integer> columnMap, String header,
                            DataFormatter formatter, FormulaEvaluator evaluator) {
        Integer index = columnMap.get(header);
        if (index == null) return "";
        Cell cell = row.getCell(index);
        return getCellValueAsString(cell, formatter, evaluator).trim();
    }

    private String getCellValueAsString(Cell cell, DataFormatter formatter,
                                        FormulaEvaluator evaluator) {
        if (cell == null) return "";
        if (cell.getCellType() == CellType.FORMULA) {
            return formatter.formatCellValue(cell, evaluator);
        }
        return formatter.formatCellValue(cell);
    }

    private boolean isEmptyRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (row == null) return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                if (!getCellValueAsString(cell, formatter, evaluator).trim().isEmpty()) return false;
            }
        }
        return true;
    }

    private void addRequestIfValid(List<KpiLibraryRequest> requests, KpiLibraryRequest request,
                                   Set<String> processedKeys) {
        String key = request.getTitle() + "|" + request.getPositionId();
        if (processedKeys.contains(key)) return;
        requests.add(request);
        processedKeys.add(key);
    }
}
