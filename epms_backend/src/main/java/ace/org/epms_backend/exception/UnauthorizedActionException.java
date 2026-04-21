package ace.org.epms_backend.exception;

public class UnauthorizedActionException extends RuntimeException {
  public UnauthorizedActionException(String msg) {
    super(msg);
  }
}
