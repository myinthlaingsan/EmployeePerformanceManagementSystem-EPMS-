package ace.org.epms_backend.exception;

public class EmailExistException extends RuntimeException{
    public EmailExistException(String message){
        super(message);
    }
}
