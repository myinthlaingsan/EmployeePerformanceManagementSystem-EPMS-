package ace.org.epms_backend.exception;

public class AlreadyActiveException extends RuntimeException{
    public AlreadyActiveException(String message){
        super(message);
    }
}
