package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.auth.AuthRequest;
import ace.org.epms_backend.dto.auth.AuthResponse;
import ace.org.epms_backend.dto.auth.RefreshTokenRequest;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.exception.InvalidTokenException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.EmployeeMapper;
import ace.org.epms_backend.model.UserPrincipal;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final EmployeeMapper employeeMapper;
    @Override
    public AuthResponse login(AuthRequest authDto) {
        Employee employee = employeeRepository.findByEmail(authDto.getEmail())
                .orElseThrow(() -> new NotFoundException("Email not found"));
        unlockIfTimeExpired(employee);
        if(employee.isAccountLocked()){
            long minutesLeft = ChronoUnit.MINUTES.between(LocalDateTime.now(),employee.getLockTime().plusMinutes(15));
            if(minutesLeft < 0) minutesLeft = 0;
            throw new LockedException("Your account is Locked. Try again in "+ minutesLeft + " minutes.");
        }
        try{
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    authDto.getEmail(),
                                    authDto.getPassword()
                            )
                    );
            if(authentication.isAuthenticated()){
                employee.setFailedLoginAttempts(0);
                employee.setAccountLocked(false);
                employee.setLockTime(null);
                employeeRepository.save(employee);

//              UserDetails userDetails = (UserDetails) authentication.getPrincipal();
                UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
                String token = jwtService.generateAccessToken(userPrincipal);
                String refreshToken = jwtService.generateRefreshToken(userPrincipal);
                return new AuthResponse(token,refreshToken, "Login successful");
            }
        }catch (BadCredentialsException ex){
            int newAttempts = employee.getFailedLoginAttempts() + 1;
            employee.setFailedLoginAttempts(newAttempts);
            String msg;
            if(newAttempts >= 3){
                employee.setAccountLocked(true);
                employee.setLockTime(LocalDateTime.now());
                msg = "Invalid credentials. Your account has been locked after 3 failed attempts.";
            }
            else{
                int remaining = 3 - newAttempts;
                msg = "Invalid credentials. You have " + remaining + " more attempt(s) before your account is locked.";
            }
            employeeRepository.save(employee);
            throw new LockedException(msg);
        }
        return new AuthResponse("fail","fail","Login Failed");
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest refreshRequest) {
        String refreshToken = refreshRequest.getRefreshToken();

        //extract username first to load user details
        String username = jwtService.extractUsername(refreshToken);
//        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        UserPrincipal userPrincipal =
                (UserPrincipal) userDetailsService.loadUserByUsername(username);
        //Now validate the refresh token with the user details
        if(!jwtService.isTokenValid(refreshToken,userPrincipal)){
            throw new InvalidTokenException("Invalid Refresh Token");
        }
        String newAccessToken = jwtService.generateAccessToken(userPrincipal);
        return new AuthResponse(newAccessToken, refreshToken, "new token success");
    }

    @Override
    public Employee unlockEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(()-> new NotFoundException("User not Found"));
        employee.setAccountLocked(false);
        employee.setFailedLoginAttempts(0);
        employee.setLockTime(null);
        return employeeRepository.save(employee);
    }

    @Override
    public Employee getCurrentUser() {

        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No user Logged in");
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getEmployee();
        }

        throw new RuntimeException("Invalid authentication principal");
    }

    @Override
    public EmployeeResponse getCurrentUserProfile() {
        return employeeMapper.toResponse(getCurrentUser());
    }

    public boolean unlockIfTimeExpired(Employee emp){
        if(emp.isAccountLocked() && emp.getLockTime() !=null){
            LocalDateTime unlockTime = emp.getLockTime().plusMinutes(15);
            if(LocalDateTime.now().isAfter(unlockTime)){
                emp.setAccountLocked(false);
                emp.setFailedLoginAttempts(0);
                emp.setLockTime(null);
                employeeRepository.save(emp);
                return true;
            }
        }
        return false;
    }
}
