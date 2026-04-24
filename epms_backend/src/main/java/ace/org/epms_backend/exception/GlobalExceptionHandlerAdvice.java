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

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleException(Exception ex){
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse<>(500,ex.getMessage(),null, LocalDateTime.now()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> handleValidationException(MethodArgumentNotValidException ex){
        Map<String,String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error-> errors.put(error.getField(),error.getDefaultMessage()));
//        return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> UserNotFoundException(UserNotFoundException ex){
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(404,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(EmailExistException.class)
    public ResponseEntity<ApiResponse<?>> EmailExistException(EmailExistException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(CodeAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> CodeAlreadyExistsException(CodeAlreadyExistsException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<ApiResponse<?>> LockedException(LockedException ex){
        return ResponseEntity.status(HttpStatus.LOCKED)
                .body(new ApiResponse<>(423,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiResponse<?>> InvalidRefreshTokenException(InvalidTokenException ex){
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(401,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(CannotDeleteException.class)
    public ResponseEntity<ApiResponse<?>> handleCannotDelete(CannotDeleteException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(CannotAssignException.class)
    public ResponseEntity<ApiResponse<?>> handleCannotAssign(CannotAssignException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(AlreadyActiveException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyActive(AlreadyActiveException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(AlreadyAssignException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyAssign(AlreadyAssignException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(PasswordIncorrectException.class)
    public ResponseEntity<ApiResponse<?>> handlePasswordIncorrect(PasswordIncorrectException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(409,ex.getMessage(),null,LocalDateTime.now()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex){
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ApiResponse<>(403,ex.getMessage(),null,LocalDateTime.now()));
    }
}
