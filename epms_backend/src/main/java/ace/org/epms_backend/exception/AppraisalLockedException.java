package ace.org.epms_backend.exception;

public class AppraisalLockedException extends RuntimeException {
  public AppraisalLockedException(String message) {
    super(message);
  }
}
