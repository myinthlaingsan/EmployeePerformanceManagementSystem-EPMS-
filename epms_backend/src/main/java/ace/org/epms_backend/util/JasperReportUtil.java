package ace.org.epms_backend.util;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Collection;
import java.util.Map;

@Component
public class JasperReportUtil {

    private static final String DEFAULT_LOGO_PATH = "static/Logo.jpg";

    public byte[] generatePdfReport(String jrxmlPath, Map<String, Object> parameters, Collection<?> data) {
        try {
            JasperPrint jasperPrint = prepareJasperPrint(jrxmlPath, parameters, data);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateExcelReport(String jrxmlPath, Map<String, Object> parameters, Collection<?> data) {
        try {
            JasperPrint jasperPrint = prepareJasperPrint(jrxmlPath, parameters, data);
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            JRXlsxExporter exporter = new JRXlsxExporter();
            exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
            exporter.setExporterOutput(new SimpleOutputStreamExporterOutput(outputStream));
            exporter.exportReport();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Excel report: " + e.getMessage(), e);
        }
    }

    private JasperPrint prepareJasperPrint(String jrxmlPath, Map<String, Object> parameters, Collection<?> data)
            throws Exception {
        // Load JRXML
        InputStream reportStream = new ClassPathResource(jrxmlPath).getInputStream();
        JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);

        // Inject Default Logo if not present
        if (!parameters.containsKey("logoStream")) {
            try {
                InputStream logoStream = new ClassPathResource(DEFAULT_LOGO_PATH).getInputStream();
                parameters.put("logoStream", logoStream);
            } catch (Exception e) {
                // If logo doesn't exist, just continue without it
                System.err.println("Warning: Default logo not found at " + DEFAULT_LOGO_PATH);
            }
        }

        // Fill Report
        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
        return JasperFillManager.fillReport(jasperReport, parameters, dataSource);
    }
}
