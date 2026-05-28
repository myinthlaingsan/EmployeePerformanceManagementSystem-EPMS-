package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.enums.Gender;
import ace.org.epms_backend.enums.RoleType;
import ace.org.epms_backend.exception.*;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.employee.*;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.EmployeeService;
import ace.org.epms_backend.util.FileUploadUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.service.AuditService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
        private final EmployeeRepository employeeRepository;
        private final RoleRepository roleRepository;
        private final ResetTokenRepository tokenRepository;
        private final PasswordEncoder passwordEncoder;
        private final PositionRepository positionRepository;
        private final DepartmentRepository departmentRepository;
        private final EmployeeMapper employeeMapper;
        private final EmployeeRoleRepository employeeRoleRepository;
        private final RoleLevelPermissionRepository roleLevelPermissionRepository;
        private final EmployeeDepartmentRepository employeeDepartmentRepository;
        private final ReportingLineRepository reportingLineRepository;
        private final AuthService authService;
        private final ApplicationEventPublisher applicationEventPublisher;
        private final AuditService auditService;
        private final PlatformTransactionManager transactionManager;

        @Override
        public EmployeeImportResult importEmployees(MultipartFile file) throws IOException {
                EmployeeImportResult result = EmployeeImportResult.builder()
                                .errors(new ArrayList<>())
                                .build();

                Map<String, Position> positionCache = positionRepository.findAll().stream()
                                .flatMap(position -> aliases(position.getPositionName(), position.getPositionCode()).stream()
                                                .map(alias -> Map.entry(alias, position)))
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, second) -> first));

                Map<String, Department> departmentCache = departmentRepository.findAll().stream()
                                .flatMap(department -> aliases(department.getDepartmentName(), department.getDepartmentCode()).stream()
                                                .map(alias -> Map.entry(alias, department)))
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, second) -> first));

                Map<String, Role> roleCache = roleRepository.findAll().stream()
                                .collect(Collectors.toMap(
                                                role -> normalize(role.getRoleName().name()),
                                                role -> role,
                                                (first, second) -> first));

                Map<String, Employee> managerCache = employeeRepository.findAll().stream()
                                .flatMap(employee -> aliases(employee.getEmail(), employee.getEmployeeCode()).stream()
                                                .map(alias -> Map.entry(alias, employee)))
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (first, second) -> first));

                TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

                try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
                        Sheet sheet = workbook.getSheetAt(0);
                        if (sheet == null || sheet.getPhysicalNumberOfRows() <= 1) {
                                result.addError("Excel file has no employee rows.");
                                return result;
                        }

                        Map<String, Integer> headers = readHeaders(sheet.getRow(0));
                        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                                Row row = sheet.getRow(rowIndex);
                                if (isEmptyRow(row)) {
                                        continue;
                                }

                                result.incrementTotalRows();
                                int rowNumber = rowIndex + 1;

                                try {
                                        CreateEmployeeRequest request = toCreateEmployeeRequest(
                                                        row,
                                                        headers,
                                                        rowNumber,
                                                        positionCache,
                                                        departmentCache,
                                                        roleCache,
                                                        managerCache);

                                        transactionTemplate.executeWithoutResult(status -> createEmployee(request));
                                        result.incrementSuccess();
                                } catch (Exception ex) {
                                        result.addError("Row " + rowNumber + ": " + ex.getMessage());
                                }
                        }
                }

                return result;
        }

        private CreateEmployeeRequest toCreateEmployeeRequest(
                        Row row,
                        Map<String, Integer> headers,
                        int rowNumber,
                        Map<String, Position> positionCache,
                        Map<String, Department> departmentCache,
                        Map<String, Role> roleCache,
                        Map<String, Employee> managerCache) {
                CreateEmployeeRequest request = new CreateEmployeeRequest();

                request.setStaffName(requiredText(row, headers, "staffName", rowNumber));
                request.setOtherName(text(row, headers, "otherName"));
                request.setEmail(requiredText(row, headers, "email", rowNumber));
                request.setPhoneNo(requiredText(row, headers, "phoneNo", rowNumber));
                request.setProfileImage(text(row, headers, "profileImage"));
                request.setStateCode(integer(row, headers, "stateCode"));
                request.setTownship(requiredText(row, headers, "township", rowNumber));
                request.setNrcType(requiredText(row, headers, "nrcType", rowNumber));
                request.setNumber(requiredText(row, headers, "number", rowNumber));
                request.setGender(parseGender(requiredText(row, headers, "gender", rowNumber)));
                request.setDateOfBirth(requiredDate(row, headers, "dateOfBirth", rowNumber));
                request.setSalary(decimal(row, headers, "salary"));
                request.setCurrency(defaultIfBlank(text(row, headers, "currency"), "MMK"));

                String positionName = requiredText(row, headers, rowNumber, "positionName", "position", "positionCode");
                Position position = positionCache.get(normalize(positionName));
                if (position == null) {
                        throw new IllegalArgumentException("Position not found: " + positionName);
                }
                request.setPositionId(position.getPositionId());

                String currentDepartmentName = requiredText(row, headers, rowNumber,
                                "currentDepartmentName", "currentDepartment", "currentDepartmentCode");
                Department currentDepartment = departmentCache.get(normalize(currentDepartmentName));
                if (currentDepartment == null) {
                        throw new IllegalArgumentException("Current department not found: " + currentDepartmentName);
                }
                request.setCurrentDepartmentId(currentDepartment.getId());

                String parentDepartmentName = text(row, headers,
                                "parentDepartmentName", "parentDepartment", "parentDepartmentCode");
                if (isBlank(parentDepartmentName)) {
                        request.setParentDepartmentId(currentDepartment.getId());
                } else {
                        Department parentDepartment = departmentCache.get(normalize(parentDepartmentName));
                        if (parentDepartment == null) {
                                throw new IllegalArgumentException("Parent department not found: " + parentDepartmentName);
                        }
                        request.setParentDepartmentId(parentDepartment.getId());
                }

                String roleName = requiredText(row, headers, rowNumber, "roleName", "role");
                Role role = roleCache.get(normalize(roleName));
                if (role == null) {
                        try {
                                role = roleCache.get(normalize(RoleType.valueOf(roleName.trim().toUpperCase(Locale.ROOT)).name()));
                        } catch (IllegalArgumentException ignored) {
                                // Keep null; detailed error is thrown below.
                        }
                }
                if (role == null) {
                        throw new IllegalArgumentException("Role not found: " + roleName);
                }
                request.setRoleId(role.getRoleId());

                String managerKey = text(row, headers,
                                "directManagerEmail", "directManagerEmployeeCode", "directManager");
                if (!isBlank(managerKey)) {
                        Employee manager = managerCache.get(normalize(managerKey));
                        if (manager == null) {
                                throw new IllegalArgumentException("Direct manager not found by email or employee code: " + managerKey);
                        }
                        request.setDirectManagerId(manager.getId());
                }

                return request;
        }

        private Map<String, Integer> readHeaders(Row headerRow) {
                if (headerRow == null) {
                        throw new IllegalArgumentException("Excel header row is required.");
                }

                Map<String, Integer> headers = new HashMap<>();
                DataFormatter formatter = new DataFormatter();
                for (Cell cell : headerRow) {
                        String header = normalizeHeader(formatter.formatCellValue(cell));
                        if (!header.isEmpty()) {
                                headers.put(header, cell.getColumnIndex());
                        }
                }
                return headers;
        }

        private List<String> aliases(String... values) {
                List<String> aliases = new ArrayList<>();
                for (String value : values) {
                        if (!isBlank(value)) {
                                aliases.add(normalize(value));
                        }
                }
                return aliases;
        }

        private String text(Row row, Map<String, Integer> headers, String... keys) {
                for (String key : keys) {
                        Integer column = headers.get(normalizeHeader(key));
                        if (column == null) {
                                continue;
                        }
                        Cell cell = row.getCell(column);
                        if (cell == null) {
                                return "";
                        }
                        return new DataFormatter().formatCellValue(cell).trim();
                }
                return "";
        }

        private String requiredText(Row row, Map<String, Integer> headers, String key, int rowNumber) {
                return requiredText(row, headers, rowNumber, key);
        }

        private String requiredText(Row row, Map<String, Integer> headers, int rowNumber, String... keys) {
                String value = text(row, headers, keys);
                if (isBlank(value)) {
                        throw new IllegalArgumentException("Missing required column value: " + keys[0]);
                }
                return value;
        }

        private Integer integer(Row row, Map<String, Integer> headers, String key) {
                String value = text(row, headers, key);
                if (isBlank(value)) {
                        return null;
                }
                return new BigDecimal(value).intValue();
        }

        private BigDecimal decimal(Row row, Map<String, Integer> headers, String key) {
                String value = text(row, headers, key);
                if (isBlank(value)) {
                        return null;
                }
                return new BigDecimal(value.replace(",", ""));
        }

        private LocalDate requiredDate(Row row, Map<String, Integer> headers, String key, int rowNumber) {
                Integer column = headers.get(normalizeHeader(key));
                if (column == null) {
                        throw new IllegalArgumentException("Missing required column value: " + key);
                }

                Cell cell = row.getCell(column);
                if (cell == null) {
                        throw new IllegalArgumentException("Missing required column value: " + key);
                }

                if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                        return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
                }

                String value = new DataFormatter().formatCellValue(cell).trim();
                if (isBlank(value)) {
                        throw new IllegalArgumentException("Missing required column value: " + key);
                }

                for (DateTimeFormatter formatter : List.of(
                                DateTimeFormatter.ISO_LOCAL_DATE,
                                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                                DateTimeFormatter.ofPattern("MM/dd/yyyy"))) {
                        try {
                                return LocalDate.parse(value, formatter);
                        } catch (DateTimeParseException ignored) {
                                // Try next supported format.
                        }
                }

                throw new IllegalArgumentException("Invalid date format for " + key + ". Use yyyy-MM-dd.");
        }

        private Gender parseGender(String value) {
                String normalized = value.trim().toUpperCase(Locale.ROOT);
                if ("MALE".equals(normalized)) {
                        return Gender.M;
                }
                if ("FEMALE".equals(normalized)) {
                        return Gender.F;
                }
                return Gender.valueOf(normalized);
        }

        private boolean isEmptyRow(Row row) {
                if (row == null) {
                        return true;
                }
                DataFormatter formatter = new DataFormatter();
                for (Cell cell : row) {
                        if (!formatter.formatCellValue(cell).trim().isEmpty()) {
                                return false;
                        }
                }
                return true;
        }

        private String normalize(String value) {
                return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        }

        private String normalizeHeader(String value) {
                return normalize(value).replaceAll("[^a-z0-9]", "");
        }

        private boolean isBlank(String value) {
                return value == null || value.trim().isEmpty();
        }

        private String defaultIfBlank(String value, String defaultValue) {
                return isBlank(value) ? defaultValue : value.trim();
        }

        @Override
        @Transactional
        public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
                String email = request.getEmail().trim().toLowerCase();
                if (email.isEmpty()) {
                        throw new RuntimeException("Email is required");
                }
                if (employeeRepository.existsByEmail(request.getEmail())) {
                        throw new EmailExistException("Email already exists");
                }
                Role role = roleRepository.findById(request.getRoleId())
                                .orElseThrow(() -> new NotFoundException("Role not found"));

                Position position = positionRepository.findById(request.getPositionId())
                                .orElseThrow(() -> new NotFoundException("Position Not Found"));
                Department parentDept = departmentRepository.findById(request.getParentDepartmentId())
                                .orElseThrow(() -> new NotFoundException("Parent Department Not Found"));

                Department currentDept = departmentRepository.findById(request.getCurrentDepartmentId())
                                .orElseThrow(() -> new NotFoundException("Current Department Not Found"));
                Employee employee = employeeMapper.toEntity(request);

                employee.setEmail(email);
                employee.setPosition(position);
                employee.setLevel(position.getLevel()); // Set level from position
                // ...
                employee.setStatus(EmployeeStatus.INACTIVE);
                employee.setPassword(null); // user will set later
                employee.setEmployeeCode(generateEmployeeCode());
                Employee savedEmployee = employeeRepository.save(employee);
                // Assign initial department
                EmployeeDepartment empDept = new EmployeeDepartment();
                empDept.setEmployee(savedEmployee);
                empDept.setParentDepartment(parentDept); // Banking
                empDept.setCurrentDepartment(currentDept); // ERP
                empDept.setIsCurrent(true);
                empDept.setCreatedBy(authService.getCurrentUser().getId());
                employeeDepartmentRepository.save(empDept);
                // roles
                EmployeeRole employeeRole = new EmployeeRole();
                employeeRole.setEmployee(savedEmployee);
                employeeRole.setRole(role);
                employeeRoleRepository.save(employeeRole);
                // Generate token
                String token = UUID.randomUUID().toString();
                ResetToken resetToken = new ResetToken();
                resetToken.setToken(token);
                resetToken.setEmployee(savedEmployee);
                resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));
                employee.setEmail(email);
                employee.setPosition(position);
                employee.setLevel(position.getLevel()); // Set level from position

                tokenRepository.save(resetToken);

                // Assign Manager (Reporting Line)
                // if (request.getDirectManagerId() != null) {
                // Employee manager = employeeRepository.findById(request.getDirectManagerId())
                // .orElseThrow(() -> new NotFoundException("Manager not found"));
                //
                // ReportingLine reportingLine = ReportingLine.builder()
                // .employee(savedEmployee)
                // .manager(manager)
                // .isActive(true)
                // .build();
                // reportingLineRepository.save(reportingLine);
                // }
                // Assign Manager (Reporting Line)
                if (request.getDirectManagerId() != null) {
                        Employee manager = employeeRepository.findById(request.getDirectManagerId())
                                        .orElseThrow(() -> new NotFoundException("Manager not found"));

                        ReportingLine reportingLine = ReportingLine.builder()
                                        .employee(savedEmployee)
                                        .manager(manager)
                                        .isActive(true)
                                        .build();
                        reportingLineRepository.save(reportingLine);
                }

                applicationEventPublisher.publishEvent(
                                new EmployeeCreatedEvent(savedEmployee.getId(), token));

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(savedEmployee.getId())
                                .action(AuditAction.INSERT)
                                .newState(savedEmployee)
                                .status(AuditStatus.SUCCESS)
                                .build());
                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(savedEmployee.getId())
                                .action(AuditAction.INSERT)
                                .newState(savedEmployee)
                                .status(AuditStatus.SUCCESS)
                                .build());

                return mapToResponse(savedEmployee);
        }

        @Override
        public void setPassword(String token, String newPassword) {
                ResetToken resetToken = tokenRepository.findByToken(token)
                                .orElseThrow(() -> new InvalidTokenException("Invalid token"));

                if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
                        throw new TokenExpiredException("Token expired");
                }

                Employee emp = resetToken.getEmployee();

                emp.setPassword(passwordEncoder.encode(newPassword));
                emp.setStatus(EmployeeStatus.ACTIVE);
                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());

                // Notify Account Activated
                applicationEventPublisher.publishEvent(NotificationEvent.builder()
                                .recipientId(emp.getId())
                                .type(NotificationType.ACCOUNT_ACTIVATED)
                                .title("Account Activated")
                                .message("Your EPMS account has been successfully activated.")
                                .referenceType(ReferenceType.ACCOUNT)
                                .actionUrl("/profile")
                                .build());
                // OPTIONAL (recommended): delete token after use
                tokenRepository.delete(resetToken);
        }

        @Override
        public EmployeeResponse getById(Long id) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));
                return mapToResponse(emp);
        }

        @Override
        public List<EmployeeResponse> getAll() {
                return employeeRepository.findAll()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();
        }

    @Override
    public PagedResponse<EmployeeResponse> getAllPaginated(int page, int size, Boolean excludeSelf) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("id").descending()
        );

        Page<Employee> employeePage;
        if (Boolean.TRUE.equals(excludeSelf)) {
            Employee currentUser = authService.getCurrentUser();
            employeePage = employeeRepository.findAllPaginatedExcluding(currentUser.getId(), pageable);
        } else {
            employeePage = employeeRepository.findAllPaginated(pageable);
        }

        List<EmployeeResponse> content = employeePage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                content,
                employeePage.getNumber(),
                employeePage.getSize(),
                employeePage.getTotalElements(),
                employeePage.getTotalPages(),
                employeePage.isLast()
        );
    }

        @Override
        public PagedResponse<EmployeeResponse> search(String query, Long departmentId, Long teamId, int page,
                        int size,Boolean excludeSelf) {
                Pageable pageable = PageRequest.of(
                                page,
                                size,
                                Sort.by("id").descending());

                Page<Employee> employeePage = employeeRepository.searchEmployees(query, departmentId, teamId, pageable);
            if (Boolean.TRUE.equals(excludeSelf)) {
                Employee currentUser = authService.getCurrentUser();
                employeePage = employeeRepository.searchEmployeesExcluding(query, currentUser.getId(), pageable);
            } else {
                employeePage = employeeRepository.searchEmployees(query,departmentId, teamId,pageable);
            }
                List<EmployeeResponse> content = employeePage.getContent()
                                .stream()
                                .map(this::mapToResponse)
                                .toList();

                return new PagedResponse<>(
                                content,
                                employeePage.getNumber(),
                                employeePage.getSize(),
                                employeePage.getTotalElements(),
                                employeePage.getTotalPages(),
                                employeePage.isLast());
        }

        @Override
        public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                employeeMapper.updateEmployeeFromDto(request, emp);

                Position position = positionRepository.findById(request.getPositionId())
                                .orElseThrow(() -> new NotFoundException("Position Not Found"));
                emp.setPosition(position);
                emp.setLevel(position.getLevel()); // Set level from position

                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());

                // Update Manager (Reporting Line)
                if (request.getDirectManagerId() != null) {
                        Optional<ReportingLine> existingLine = reportingLineRepository
                                        .findByEmployeeAndIsActiveTrue(updated);

                        if (existingLine.isEmpty() || !existingLine.get().getManager().getId()
                                        .equals(request.getDirectManagerId())) {
                                // Deactivate old one
                                existingLine.ifPresent(line -> {
                                        line.setIsActive(false);
                                        reportingLineRepository.save(line);
                                });

                                // Create new one
                                Employee newManager = employeeRepository.findById(request.getDirectManagerId())
                                                .orElseThrow(() -> new NotFoundException("Manager not found"));

                                ReportingLine newLine = ReportingLine.builder()
                                                .employee(updated)
                                                .manager(newManager)
                                                .isActive(true)
                                                .build();
                                reportingLineRepository.save(newLine);
                        }
                }

                return mapToResponse(updated);
        }

        @Override
        public void deleteEmployee(Long id) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                emp.setIsActive(false);
                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());
        }

        @Override
        public void activateEmployee(Long id) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));
                emp.setStatus(EmployeeStatus.ACTIVE);
                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());
        }

        @Override
        public void deactivateEmployee(Long id) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));
                emp.setStatus(EmployeeStatus.INACTIVE);
                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());
        }

        @Override
        public List<EmployeeResponse> getDirectReports(Long managerId) {
                Employee manager = employeeRepository.findById(managerId)
                                .orElseThrow(() -> new NotFoundException("Manager not found"));

                return reportingLineRepository.findAllByManagerAndIsActiveTrue(manager).stream()
                                .map(ReportingLine::getEmployee)
                                .map(this::mapToResponse)
                                .toList();
        }

        @Override
        public EmployeeResponse getManager(Long employeeId) {
                Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                return reportingLineRepository.findByEmployeeAndIsActiveTrue(employee)
                                .map(ReportingLine::getManager)
                                .map(this::mapToResponse)
                                .orElse(null);
        }

        @Override
        public Employee findByEmail(String email) {
                return employeeRepository.findByEmail(email)
                                .orElseThrow(() -> new NotFoundException("Employee not found with email: " + email));
        }

        @Override
        @Transactional
        public EmployeeResponse updateProfile(UpdateProfileRequest request) {
                Employee emp = authService.getCurrentUser();

                // Optional: prevent duplicate email
                if (request.getEmail() != null &&
                                !request.getEmail().equals(emp.getEmail()) &&
                                employeeRepository.existsByEmail(request.getEmail())) {

                        throw new EmailExistException("Email already exists");
                }
                // Capture old state for audit
                Employee oldState = Employee.builder()
                                .staffName(emp.getStaffName())
                                .email(emp.getEmail())
                                .phoneNo(emp.getPhoneNo())
                                .build();

                // useMapstruct
                employeeMapper.updateProfileFromDto(request, emp);

                Employee updated = employeeRepository.save(emp);

                // Log Audit
                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .oldState(oldState)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());

                // Notify Profile Updated
                applicationEventPublisher.publishEvent(NotificationEvent.builder()
                                .recipientId(updated.getId())
                                .type(NotificationType.PROFILE_UPDATED)
                                .title("Profile Updated")
                                .message("Your profile information has been updated.")
                                .referenceType(ReferenceType.ACCOUNT)
                                .actionUrl("/profile")
                                .build());

                return mapToResponse(updated);
        }

        @Override
        public void uploadProfileImage(Long id, MultipartFile file) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));

                try {
                        String uploadDir = System.getProperty("user.dir") + "/uploads/profiles/";
                        String fileName = "emp_" + id;
                        String savedFileName = FileUploadUtil.saveFile(uploadDir, fileName,
                                        file);

                        emp.setProfileImage("/uploads/profiles/" + savedFileName);
                        employeeRepository.save(emp);
                } catch (java.io.IOException e) {
                        throw new RuntimeException("Could not upload profile image", e);
                }
        }

        @Override
        public void changePassword(Long id, ChangePasswordRequest request) {
                Employee emp = employeeRepository.findById(id)
                                .orElseThrow(() -> new NotFoundException("Employee not found"));
                if (!passwordEncoder.matches(request.getOldPassword(), emp.getPassword())) {
                        throw new PasswordIncorrectException("Old password incorrect");
                }
                emp.setPassword(passwordEncoder.encode(request.getNewPassword()));
                Employee updated = employeeRepository.save(emp);

                auditService.log(AuditRequest.builder()
                                .tableName("employees")
                                .recordId(updated.getId())
                                .action(AuditAction.UPDATE)
                                .newState(updated)
                                .status(AuditStatus.SUCCESS)
                                .build());

                // Notify Password Changed
                applicationEventPublisher.publishEvent(NotificationEvent.builder()
                                .recipientId(emp.getId())
                                .type(NotificationType.PASSWORD_CHANGED)
                                .title("Password Changed")
                                .message("Your account password has been successfully changed.")
                                .referenceType(ReferenceType.ACCOUNT)
                                .actionUrl("/profile")
                                .build());
        }

        private String generateEmployeeCode() {
                long count = employeeRepository.count() + 1;
                return String.format("EMP%05d", count);
        }

        private EmployeeResponse mapToResponse(Employee emp) {
                EmployeeResponse response = employeeMapper.toResponse(emp);
                List<Role> roles = employeeRoleRepository.findRolesByEmployeeId(emp.getId());
                List<String> roleNames = roles.stream()
                                .map(role -> role.getRoleName().name())
                                .toList();
                response.setRoles(roleNames);

                // Fetch permissions based on roles and level
                List<String> permissions = roleLevelPermissionRepository
                                .findPermissionsByRolesAndLevel(roles, emp.getLevel())
                                .stream()
                                .map(Permission::getPermissionName)
                                .toList();
                response.setPermissions(permissions);

                // Set Department Name
                employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(emp.getId())
                                .ifPresent(ed -> {
                                        response.setCurrentDepartmentName(
                                                        ed.getCurrentDepartment().getDepartmentName());
                                        response.setCurrentDepartmentId(
                                                        ed.getCurrentDepartment().getId());
                                        response.setParentDepartmentName(
                                                        ed.getParentDepartment().getDepartmentName());
                                        response.setParentDepartmentId(
                                                        ed.getParentDepartment().getId());
                                });
                // Set Manager Info
                reportingLineRepository.findByEmployeeAndIsActiveTrue(emp)
                                .ifPresent(line -> {
                                        response.setDirectManagerId(line.getManager().getId());
                                        response.setDirectManagerName(line.getManager().getStaffName());
                                });
                return response;
        }
}
