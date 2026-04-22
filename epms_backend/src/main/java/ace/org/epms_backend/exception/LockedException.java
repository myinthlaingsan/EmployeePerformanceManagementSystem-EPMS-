package ace.org.epms_backend.exception;

public class LockedException extends RuntimeException{
    public LockedException(String message){
        super(message);
    }
}
