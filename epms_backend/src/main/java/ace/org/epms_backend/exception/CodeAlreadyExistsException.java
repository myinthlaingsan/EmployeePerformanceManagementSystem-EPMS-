package ace.org.epms_backend.exception;

public class CodeAlreadyExistsException extends RuntimeException{
    public CodeAlreadyExistsException(String message){
        super(message);
    }
}
