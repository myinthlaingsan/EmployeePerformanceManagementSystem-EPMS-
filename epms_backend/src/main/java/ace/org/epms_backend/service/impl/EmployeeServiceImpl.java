package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.employee.CreateEmployeeRequest;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.enums.EmployeeStatus;
import ace.org.epms_backend.exception.EmailExistException;
import ace.org.epms_backend.exception.InvalidTokenException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.exception.TokenExpiredException;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.ResetToken;
import ace.org.epms_backend.model.employee.Role;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.EmailService;
import ace.org.epms_backend.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
                        .orElseThrow(() -> new RuntimeException("Level not found"))
        );
        employee.setStatus(EmployeeStatus.INACTIVE);
        employee.setPassword(null); // user will set later
        employee.setEmployeeCode(generateEmployeeCode());
        employeeRepository.save(employee);
        // Generate token
        String token = UUID.randomUUID().toString();
        ResetToken resetToken = new ResetToken();
        resetToken.setToken(token);
        resetToken.setEmployee(employee);
        resetToken.setExpiryDate(LocalDateTime.now().plusHours(24));

        tokenRepository.save(resetToken);

        // Send email
        String link = "http://localhost:5173/api/auth/set-password?token=" + token;

        emailService.sendEmail(
                employee.getEmail(),
                "Set Your Password",
                "Click here: " + link
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

    private String generateEmployeeCode() {
        long count = employeeRepository.count() + 1;
        return String.format("EMP%05d", count);
    }


}
