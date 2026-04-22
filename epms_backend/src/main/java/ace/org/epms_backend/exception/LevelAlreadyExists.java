package ace.org.epms_backend.exception;

public class LevelAlreadyExists extends RuntimeException{
    public LevelAlreadyExists(String message){
        super(message);
    }
}
