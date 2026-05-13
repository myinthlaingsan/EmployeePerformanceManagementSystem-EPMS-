package ace.org.epms_backend.util.excel;

import ace.org.epms_backend.dto.kpi.KpiLibraryDetailRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.kpi.KpiCategory;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import ace.org.epms_backend.model.kpi.KpiCategory; // adjust package to match yours
import java.io.IOException;
import java.math.BigDecimal;
import java.util.*;

@Component
@RequiredArgsConstructor
public class StyledKpiExcelParser {

    private final PositionRepository positionRepository;
    private final KpiCategoryRepository categoryRepository;

    private static final String HEADER_KPI = "KPI";
    private static final String HEADER_CATEGORY = "CATEGORY";
    private static final String HEADER_TARGET = "TARGET";
    private static final String HEADER_UNIT = "UNIT";
    private static final String HEADER_WEIGHT = "WEIGHT";

    public List<KpiLibraryRequest> parse(MultipartFile file) throws IOException {
        List<KpiLibraryRequest> requests = new ArrayList<>();
        Set<String> processedKeys = new HashSet<>(); // Title + PositionId to detect duplicates in file
        Map<String, Integer> columnMap = new HashMap<>(); // Dynamic Column Map

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter();
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rowIterator = sheet.iterator();

            KpiLibraryRequest currentLibrary = null;
            List<KpiLibraryDetailRequest> currentDetails = null;

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                if (isEmptyRow(row, formatter, evaluator))
                    continue;

                // 1. Detect KPI Library Title (e.g., "07-PS HEAD KPI")
                String libraryTitle = findLibraryTitle(row, formatter, evaluator);

                if (libraryTitle != null) {
                    if (currentLibrary != null && currentDetails != null && !currentDetails.isEmpty()) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }
                    columnMap.clear(); // Reset mapping for new section
                    currentLibrary = new KpiLibraryRequest();
                    currentLibrary.setTitle(libraryTitle);
                    currentLibrary.setPositionId(resolvePositionId(libraryTitle));
                    currentDetails = new ArrayList<>();
                    currentLibrary.setDetails(currentDetails);
                    continue;
                }

                // 2. Detect Header Row and Build Mapping
                if (columnMap.isEmpty() && buildColumnMap(row, formatter, evaluator, columnMap)) {
                    continue;
                }

                // 3. Detect Total Score Row (Finalize Section)
                if (isTotalScoreRow(row, formatter, evaluator)) {
                    if (currentLibrary != null && currentDetails != null && !currentDetails.isEmpty()) {
                        addRequestIfValid(requests, currentLibrary, processedKeys);
                    }
                    currentLibrary = null;
                    currentDetails = null;
                    continue;
                }

                // 4. Parse KPI Detail Row
                if (currentLibrary != null && currentDetails != null && !columnMap.isEmpty()) {
                    KpiLibraryDetailRequest detail = parseDetailRow(row, formatter, evaluator, columnMap);
                    if (detail != null) {
                        currentDetails.add(detail);
                    }
                }
            }

            // Final fallback: Capture the last library if file ended without a "Total
            // Score" row
            if (currentLibrary != null && currentDetails != null && !currentDetails.isEmpty()) {
                addRequestIfValid(requests, currentLibrary, processedKeys);
            }
        }

        return requests;
    }

    private void addRequestIfValid(List<KpiLibraryRequest> requests, KpiLibraryRequest request,
            Set<String> processedKeys) {
        String key = request.getTitle() + "|" + request.getPositionId();
        if (processedKeys.contains(key)) {
            return;
        }
        requests.add(request);
        processedKeys.add(key);
    }

    private String findLibraryTitle(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (Cell cell : row) {
            String value = getCellValueAsString(cell, formatter, evaluator).trim();
            if (isLibraryTitle(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean isLibraryTitle(String value) {
        String upper = value.toUpperCase().trim();

        // Improved Regex: Matches "XX-NAME KPI" or "NAME KPI" but not "KPI Summary"
        // etc.
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
            if (value.equals("KPI"))
                tempMap.put(HEADER_KPI, cell.getColumnIndex());
            else if (value.contains("CATEGORY"))
                tempMap.put(HEADER_CATEGORY, cell.getColumnIndex());
            else if (value.contains("TARGET"))
                tempMap.put(HEADER_TARGET, cell.getColumnIndex());
            else if (value.contains("UNIT"))
                tempMap.put(HEADER_UNIT, cell.getColumnIndex());
            else if (value.contains("WEIGHT") && !value.contains("SCORE"))
                tempMap.put(HEADER_WEIGHT, cell.getColumnIndex());
        }

        // To identify a header row, we only strictly require KPI and CATEGORY.
        // If Target or Weight are missing or misnamed, the detail row parser will catch
        // it and report the exact row.
        if (tempMap.containsKey(HEADER_KPI) && tempMap.containsKey(HEADER_CATEGORY)) {
            columnMap.putAll(tempMap);
            return true;
        }
        return false;
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
        String cleanTitle = title.replaceAll("(?i)\\s*KPI\\s*$", "").trim();

        if (cleanTitle.contains("-")) {
            String[] parts = cleanTitle.split("-", 2);
            String code = parts[0].trim();
            String name = parts[1].trim();

            var posByCode = positionRepository.findByPositionCode(code);
            if (posByCode.isPresent())
                return posByCode.get().getPositionId();

            var posByName = positionRepository.findByPositionNameIgnoreCase(name);
            if (posByName.isPresent())
                return posByName.get().getPositionId();
        }

        return positionRepository.findByPositionNameIgnoreCase(cleanTitle)
                .orElseThrow(() -> new NotFoundException("Position not found for title: " + title))
                .getPositionId();
    }

    private KpiLibraryDetailRequest parseDetailRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator,
            Map<String, Integer> columnMap) {
        String goalTitle = getValue(row, columnMap, HEADER_KPI, formatter, evaluator);
        String categoryName = getValue(row, columnMap, HEADER_CATEGORY, formatter, evaluator);
        String targetStr = getValue(row, columnMap, HEADER_TARGET, formatter, evaluator);
        String unit = getValue(row, columnMap, HEADER_UNIT, formatter, evaluator);
        String weightStr = getValue(row, columnMap, HEADER_WEIGHT, formatter, evaluator);

        if (goalTitle.isBlank())
            return null;

        int rowNum = row.getRowNum() + 1;

        if (categoryName.isBlank()) {
            throw new IllegalArgumentException("Row " + rowNum + ": Category is required for KPI: " + goalTitle);
        }

        KpiLibraryDetailRequest detail = new KpiLibraryDetailRequest();
        detail.setGoalTitle(goalTitle);
        detail.setUnit(unit);

        String normalizedName = categoryName.trim();
        Long categoryId = categoryRepository.findByNameIgnoreCase(normalizedName)
                .map(KpiCategory::getId)
                .orElseGet(() -> {
                    KpiCategory newCat = new KpiCategory();
                    newCat.setName(normalizedName);
                    return categoryRepository.save(newCat).getId();
                });
        detail.setCategoryId(categoryId);

        // Improved numeric parsing with explicit error handling
        detail.setTargetValue(parseBigDecimal(targetStr, "Target Value", goalTitle, rowNum));
        detail.setWeightPercent(parseBigDecimal(weightStr, "Weight (%)", goalTitle, rowNum));

        return detail;
    }

    private String getValue(Row row, Map<String, Integer> columnMap, String header, DataFormatter formatter,
            FormulaEvaluator evaluator) {
        Integer index = columnMap.get(header);
        if (index == null)
            return "";
        Cell cell = row.getCell(index);
        return getCellValueAsString(cell, formatter, evaluator).trim();
    }

    private BigDecimal parseBigDecimal(String value, String fieldName, String kpiTitle, int rowNum) {
        if (value == null || value.isEmpty()) {
            if (fieldName.equals("Target Value"))
                return null;
            throw new IllegalArgumentException(
                    "Row " + rowNum + ": " + fieldName + " is required for KPI: " + kpiTitle);
        }
        try {
            // Safe version: Only remove % and comma. Do not blindly strip all non-numeric
            // chars
            // to avoid creating invalid values like "12.5.6" from "12.5-6"
            String cleanValue = value.replace("%", "").replace(",", "").trim();
            if (cleanValue.isEmpty()) {
                throw new IllegalArgumentException(
                        "Row " + rowNum + ": Invalid " + fieldName + ": '" + value + "' for KPI: " + kpiTitle);
            }
            return new BigDecimal(cleanValue);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Row " + rowNum + ": Failed to parse " + fieldName + " from value: '"
                    + value + "' for KPI: " + kpiTitle + ". Please ensure it is a valid numeric value.");
        }
    }

    private String getCellValueAsString(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (cell == null)
            return "";
        // Best approach for Excel: DataFormatter + FormulaEvaluator
        if (cell.getCellType() == CellType.FORMULA) {
            return formatter.formatCellValue(cell, evaluator);
        }
        return formatter.formatCellValue(cell);
    }

    private boolean isEmptyRow(Row row, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (row == null)
            return true;
        for (int i = 0; i < row.getLastCellNum(); i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String val = getCellValueAsString(cell, formatter, evaluator);
                if (!val.trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }
}
