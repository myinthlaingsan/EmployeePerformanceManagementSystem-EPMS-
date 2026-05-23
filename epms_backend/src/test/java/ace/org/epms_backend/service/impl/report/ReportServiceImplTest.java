package ace.org.epms_backend.service.impl.report;

import ace.org.epms_backend.dto.report.PipDetailReportObjectiveDTO;
import ace.org.epms_backend.enums.PipStatus;
import ace.org.epms_backend.enums.PipSeverity;
import ace.org.epms_backend.enums.PipOutcome;
import ace.org.epms_backend.exception.InvalidAppraisalStateException;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import ace.org.epms_backend.model.employee.Department;
import ace.org.epms_backend.model.pip.PipObjective;
import ace.org.epms_backend.model.pip.PipRecord;
import ace.org.epms_backend.model.pip.PipProgressLog;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.repository.employee.EmployeeTeamRepository;
import ace.org.epms_backend.repository.employee.ReportingLineRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackRequestRepository;
import ace.org.epms_backend.repository.feedback360.FeedbackSummaryRepository;
import ace.org.epms_backend.service.feedback360.FeedbackReportService;
import ace.org.epms_backend.util.JasperReportUtil;
import ace.org.epms_backend.service.impl.report.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock private KpiGoalsRepository kpiGoalsRepository;
    @Mock private AppraisalRepository appraisalRepository;
    @Mock private EmployeeDepartmentRepository employeeDepartmentRepository;
    @Mock private FeedbackRequestRepository feedbackRequestRepository;
    @Mock private PipRecordRepository pipRecordRepository;
    @Mock private PipProgressLogRepository pipProgressLogRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private KpiFinalScoreRepository kpiFinalScoreRepository;
    @Mock private AppraisalCycleRepository appraisalCycleRepository;
    @Mock private SelfAssessmentRepository selfAssessmentRepository;
    @Mock private ManagerEvaluationRepository managerEvaluationRepository;
    @Mock private FeedbackSummaryRepository feedbackSummaryRepository;
    @Mock private AppraisalSummaryRepository appraisalSummaryRepository;
    @Mock private ReportingLineRepository reportingLineRepository;
    @Mock private EmployeeTeamRepository employeeTeamRepository;
    @Mock private JasperReportUtil jasperReportUtil;
    @Mock private FeedbackReportService feedbackReportService;
    @Mock private QuestionRepository questionRepository;
    @Mock private FeedbackRepository feedbackRepository;
    @Mock private SelfAssessmentAnswerRepository selfAssessmentAnswerRepository;
    @Mock private ManagerEvaluationAnswerRepository managerEvaluationAnswerRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private PipRecord pip;
    private Employee employee;
    private Employee manager;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(1L);
        employee.setStaffName("John Doe");
        employee.setEmployeeCode("EMP001");

        manager = new Employee();
        manager.setId(2L);
        manager.setStaffName("Jane Smith");

        pip = new PipRecord();
        pip.setPipId(10L);
        pip.setEmployee(employee);
        pip.setManager(manager);
        pip.setStartDate(LocalDate.now().minusDays(10));
        pip.setEndDate(LocalDate.now().plusDays(20));
        pip.setSeverity(PipSeverity.STANDARD);
        pip.setReason("Needs improvement in core metrics");
        pip.setOverallComment("Good effort");
        pip.setFinalOutcome(PipOutcome.SUCCESSFUL);
        pip.setObjectives(new ArrayList<>());
    }

    @Test
    void exportPipDetailReport_returnsPdfBytes_whenCompleted() {
        pip.setStatus(PipStatus.COMPLETED);

        PipObjective obj = new PipObjective();
        obj.setObjectiveId(100L);
        obj.setTitle("Objective 1");
        obj.setDescription("Desc 1");
        obj.setSuccessCriteria("Criteria 1");
        obj.setStatus(ace.org.epms_backend.enums.ObjectiveStatus.COMPLETED);
        pip.getObjectives().add(obj);

        PipProgressLog log = new PipProgressLog();
        log.setProgressPercent(new BigDecimal("100.00"));
        log.setProgressNote("Done");

        when(pipRecordRepository.findById(10L)).thenReturn(Optional.of(pip));
        when(employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(1L)).thenReturn(Optional.empty());
        when(pipProgressLogRepository.findFirstByObjective_ObjectiveIdOrderByCreatedAtDesc(100L))
                .thenReturn(Optional.of(log));

        byte[] expectedBytes = new byte[]{1, 2, 3};
        when(jasperReportUtil.generatePdfReport(anyString(), anyMap(), anyList())).thenReturn(expectedBytes);

        byte[] result = reportService.exportPipDetailReport(10L, "pdf");

        assertNotNull(result);
        assertArrayEquals(expectedBytes, result);
        verify(jasperReportUtil).generatePdfReport(eq("reports/pip_detail_report.jrxml"), anyMap(), anyList());
    }

    @Test
    void exportPipDetailReport_returnsPdfBytes_whenClosed() {
        pip.setStatus(PipStatus.CLOSED);

        when(pipRecordRepository.findById(10L)).thenReturn(Optional.of(pip));
        when(employeeDepartmentRepository.findByEmployeeIdAndIsCurrentTrue(1L)).thenReturn(Optional.empty());

        byte[] expectedBytes = new byte[]{4, 5, 6};
        when(jasperReportUtil.generatePdfReport(anyString(), anyMap(), anyList())).thenReturn(expectedBytes);

        byte[] result = reportService.exportPipDetailReport(10L, "pdf");

        assertNotNull(result);
        assertArrayEquals(expectedBytes, result);
    }

    @Test
    void exportPipDetailReport_throws409_whenDraftOrActiveOrExtended() {
        pip.setStatus(PipStatus.ACTIVE);
        when(pipRecordRepository.findById(10L)).thenReturn(Optional.of(pip));

        assertThrows(InvalidAppraisalStateException.class, () -> {
            reportService.exportPipDetailReport(10L, "pdf");
        });

        pip.setStatus(PipStatus.DRAFT);
        assertThrows(InvalidAppraisalStateException.class, () -> {
            reportService.exportPipDetailReport(10L, "pdf");
        });

        pip.setStatus(PipStatus.EXTENDED);
        assertThrows(InvalidAppraisalStateException.class, () -> {
            reportService.exportPipDetailReport(10L, "pdf");
        });
    }

    @Test
    void exportPipDetailReport_throws404_whenPipMissing() {
        when(pipRecordRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> {
            reportService.exportPipDetailReport(99L, "pdf");
        });
    }
}
