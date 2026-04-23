package ace.org.epms_backend.exception;

public class CannotDeleteException extends RuntimeException{
    public CannotDeleteException(String message){
        super(message);
    }
}
