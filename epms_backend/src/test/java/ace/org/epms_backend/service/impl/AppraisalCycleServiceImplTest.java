package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalCycleRequest;
import ace.org.epms_backend.enums.CycleStatus;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.repository.AppraisalCycleRepository;
import ace.org.epms_backend.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppraisalCycleServiceImplTest {

    @Mock
    private AppraisalCycleRepository appraisalCycleRepository;
    
    @Mock
    private AuditService auditService;
    
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AppraisalCycleServiceImpl appraisalCycleService;

    private AppraisalCycle archivedCycle;
    private AppraisalCycle activeCycle;

    @BeforeEach
    void setUp() {
        archivedCycle = new AppraisalCycle();
        archivedCycle.setCycleId(1L);
        archivedCycle.setCycleName("Archived Cycle");
        archivedCycle.setStatus(CycleStatus.ARCHIVED);

        activeCycle = new AppraisalCycle();
        activeCycle.setCycleId(2L);
        activeCycle.setCycleName("Active Cycle");
        activeCycle.setStatus(CycleStatus.PLANNING);
    }

    @Test
    void activate_shouldThrow_whenCycleIsArchived() {
        when(appraisalCycleRepository.findById(1L)).thenReturn(Optional.of(archivedCycle));
        
        assertThrows(IllegalStateException.class, () -> {
            appraisalCycleService.activate(1L);
        });
        
        verify(auditService, times(1)).log(any());
        verify(appraisalCycleRepository, never()).save(any());
    }

    @Test
    void update_shouldThrow_whenCycleIsArchived() {
        when(appraisalCycleRepository.findById(1L)).thenReturn(Optional.of(archivedCycle));
        
        AppraisalCycleRequest request = new AppraisalCycleRequest();
        
        assertThrows(IllegalStateException.class, () -> {
            appraisalCycleService.update(1L, request);
        });
        
        verify(auditService, times(1)).log(any());
        verify(appraisalCycleRepository, never()).save(any());
    }

    @Test
    void close_shouldThrow_whenCycleAlreadyArchived() {
        when(appraisalCycleRepository.findById(1L)).thenReturn(Optional.of(archivedCycle));
        
        assertThrows(IllegalStateException.class, () -> {
            appraisalCycleService.close(1L);
        });
        
        verify(auditService, times(1)).log(any());
        verify(appraisalCycleRepository, never()).save(any());
    }

    @Test
    void schedulerDrivenClose_shouldBeNoOp_whenCycleAlreadyArchived() {
        when(appraisalCycleRepository.findById(1L)).thenReturn(Optional.of(archivedCycle));
        
        appraisalCycleService.schedulerDrivenClose(1L);
        
        verify(appraisalCycleRepository, never()).save(any());
        verify(eventPublisher, never()).publishEvent(any());
    }
}
