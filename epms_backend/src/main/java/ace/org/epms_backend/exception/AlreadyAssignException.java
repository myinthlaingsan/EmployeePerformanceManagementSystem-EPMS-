package ace.org.epms_backend.exception;

public class AlreadyAssignException extends RuntimeException{
    public AlreadyAssignException(String message){
        super(message);
    }
}
