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

    public byte[] generatePdfReport(String jrxmlPath, Map<String, Object> parameters, Collection<?> data) {
        try {
            InputStream reportStream = new ClassPathResource(jrxmlPath).getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            return JasperExportManager.exportReportToPdf(jasperPrint);
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report: " + e.getMessage(), e);
        }
    }

    public byte[] generateExcelReport(String jrxmlPath, Map<String, Object> parameters, Collection<?> data) {
        try {
            InputStream reportStream = new ClassPathResource(jrxmlPath).getInputStream();
            JasperReport jasperReport = JasperCompileManager.compileReport(reportStream);
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);

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
}
