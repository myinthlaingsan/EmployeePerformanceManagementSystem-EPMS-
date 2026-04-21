package ace.org.epms_backend.exception;

import ace.org.epms_backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandlerAdvice {

    // ✅ VALIDATION ERROR
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

        return ResponseEntity.badRequest().body(errors);
    }
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(404, ex.getMessage(), null, LocalDateTime.now()));
    }

    // ================= USER =================

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleUserNotFound(UserNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(404, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(EmailExistException.class)
    public ResponseEntity<ApiResponse<?>> handleEmailExist(EmailExistException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(CodeAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleCodeExist(CodeAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    // ================= SECURITY =================

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiResponse<?>> handleInvalidToken(InvalidTokenException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(401, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(UnauthorizedActionException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorized(UnauthorizedActionException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(403, ex.getMessage(), null, LocalDateTime.now()));
    }

    // ================= BUSINESS =================

    @ExceptionHandler(CannotDeleteException.class)
    public ResponseEntity<ApiResponse<?>> handleCannotDelete(CannotDeleteException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(CannotAssignException.class)
    public ResponseEntity<ApiResponse<?>> handleCannotAssign(CannotAssignException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(AlreadyActiveException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyActive(AlreadyActiveException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(AlreadyAssignException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyAssign(AlreadyAssignException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409, ex.getMessage(), null, LocalDateTime.now()));
    }

    // ================= APPRAISAL =================

    @ExceptionHandler(AppraisalException.class)
    public ResponseEntity<ApiResponse<?>> handleAppraisal(AppraisalException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(400, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(AppraisalLockedException.class)
    public ResponseEntity<ApiResponse<?>> handleAppraisalLocked(AppraisalLockedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(403, ex.getMessage(), null, LocalDateTime.now()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<?>> handleLocked(LockedException ex) {
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ApiResponse<>(423, ex.getMessage(), null, LocalDateTime.now()));
    }

    // ================= GLOBAL =================

    // ✅ ONLY ONE GENERAL HANDLER (IMPORTANT)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(500, "Internal Server Error", null, LocalDateTime.now()));
    }

    @ExceptionHandler(PasswordIncorrectException.class)
    public ResponseEntity<ApiResponse<?>> handlePasswordIncorrect(PasswordIncorrectException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }
}
