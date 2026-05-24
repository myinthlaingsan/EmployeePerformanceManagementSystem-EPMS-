package ace.org.epms_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private Integer code;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    public ApiResponse(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }
    public static <T> ApiResponse<T> success(T data){
        return new ApiResponse<T>(HttpStatus.OK.value(), "success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<T>(HttpStatus.OK.value(), message, data);
    }

    public static <T> ApiResponse<T> success(){
        return new ApiResponse<T>(HttpStatus.OK.value(), "success", null);
    }
    //you can delete if u don't need just api test

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<T>(HttpStatus.BAD_REQUEST.value(), message, null);
    }
}