package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.config.EmailTemplateBuilder;
import ace.org.epms_backend.dto.employee.*;
import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.exception.*;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeRole;
import ace.org.epms_backend.model.employee.ResetToken;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.EmailService;
import ace.org.epms_backend.service.EmployeeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final ResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PositionRepository positionRepository;
    private final JobLevelRepository levelRepository;
    private final EmployeeMapper employeeMapper;
    private final EmployeeRoleRepository employeeRoleRepository;

    @Override

    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail())) {
            throw new EmailExistException("Email already exists");
        }
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new NotFoundException("Role not found"));
        Employee employee = employeeMapper.toEntity(request);

        employee.setPosition(
                positionRepository.findById(request.getPositionId())
                        .orElseThrow(() -> new NotFoundException("Position Not Found"))
        );
        employee.setLevel(
                levelRepository.findById(request.getLevelId())
                        .orElseThrow(() -> new NotFoundException("Level not found"))
        );
        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setPassword(null); // user will set later
        employee.setEmployeeCode(generateEmployeeCode());
        Employee savedEmployee = employeeRepository.save(employee);

        EmployeeRole employeeRole = new EmployeeRole();
        employeeRole.setEmployee(savedEmployee);
        employeeRole.setRole(role);
        employeeRoleRepository.save(employeeRole);
        // Generate token
        String token = UUID.randomUUID().toString();
        ResetToken resetToken = new ResetToken();
        resetToken.setToken(token);
        resetToken.setEmployee(employee);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        tokenRepository.save(resetToken);

        // Send email
        String link = "http://localhost:5173/set-password?token=" + token;
        String htmlContent = EmailTemplateBuilder.buildSetPasswordEmail(
                employee.getStaffName(),
                link
        );
//        emailService.sendEmail(
//                employee.getEmail(),
//                "Set Your Password",
//                "Click here: " + link
//        );
        emailService.sendHtmlEmail(
                employee.getEmail(),
                "Set Your Password",
                htmlContent
        );
        return employeeMapper.toResponse(employee);
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
        employeeRepository.save(emp);
        // OPTIONAL (recommended): delete token after use
        tokenRepository.delete(resetToken);
    }

    @Override
    public EmployeeResponse getById(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        return employeeMapper.toResponse(emp);
    }

    @Override
    public List<EmployeeResponse> getAll() {
        return employeeRepository.findAll()
                .stream()
                .map(employeeMapper::toResponse)
                .toList();
    }

    @Override
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        employeeMapper.updateEmployeeFromDto(request, emp);

        emp.setPosition(positionRepository.findById(request.getPositionId()).orElseThrow());
        emp.setLevel(levelRepository.findById(request.getLevelId()).orElseThrow());

        return employeeMapper.toResponse(emp);
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        emp.setIsActive(false);
        employeeRepository.save(emp);
    }

    @Override
    public void activateEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        emp.setStatus(EmployeeStatus.ACTIVE);
    }

    @Override
    public void deactivateEmployee(Long id) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        emp.setStatus(EmployeeStatus.INACTIVE);
    }

    @Override
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Employee not found with email: " + email));
    }

    @Override
    @Transactional
    public EmployeeResponse updateProfile(Long id, UpdateProfileRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        // Optional: prevent duplicate email
        if (request.getEmail() != null &&
                !request.getEmail().equals(emp.getEmail()) &&
                employeeRepository.existsByEmail(request.getEmail())) {

            throw new EmailExistException("Email already exists");
        }
        //useMapstruct
        employeeMapper.updateProfileFromDto(request, emp);

        Employee updated = employeeRepository.save(emp);

        return employeeMapper.toResponse(updated);
    }

    @Override
    public void changePassword(Long id, ChangePasswordRequest request) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), emp.getPassword())) {
            throw new PasswordIncorrectException("Old password incorrect");
        }

        emp.setPassword(passwordEncoder.encode(request.getNewPassword()));
    }

    private String generateEmployeeCode() {
        long count = employeeRepository.count() + 1;
        return String.format("EMP%05d", count);
    }
}
