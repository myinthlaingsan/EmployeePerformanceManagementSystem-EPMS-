package ace.org.epms_backend.exception;

import java.util.List;

public class BulkImportValidationException extends RuntimeException {
    private final List<String> errors;

    public BulkImportValidationException(List<String> errors) {
        super("Import validation failed");
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}
