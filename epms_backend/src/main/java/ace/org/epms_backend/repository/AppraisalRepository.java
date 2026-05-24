package ace.org.epms_backend.repository;

import ace.org.epms_backend.enums.AppraisalStatus;
import ace.org.epms_backend.model.appraisal.Appraisal;
import ace.org.epms_backend.model.appraisal.AppraisalCycle;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AppraisalRepository extends JpaRepository<Appraisal, Long> {
    List<Appraisal> findByEmployee_Id(Long employeeId);
    List<Appraisal> findByManager_Id(Long managerId);
    List<Appraisal> findByCycle_CycleId(Long cycleId);
    Optional<Appraisal> findByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
    @Query("SELECT a FROM Appraisal a WHERE a.employee.id = :employeeId AND a.cycle.cycleId = :cycleId")
    Optional<Appraisal> findByEmployeeAndCycleIds(@Param("employeeId") Long employeeId, @Param("cycleId") Long cycleId);
    Optional<Appraisal> findByEmployeeAndCycle(Employee employee, AppraisalCycle cycle);
    List<Appraisal> findAllByEmployee_IdAndCycle_CycleId(Long employeeId, Long cycleId);
    
    List<Appraisal> findByEmployee_IdAndStatusIn(Long employeeId, List<AppraisalStatus> statuses);
    List<Appraisal> findByManager_IdAndStatusIn(Long managerId, List<AppraisalStatus> statuses);
 
    @Query("SELECT COUNT(a) > 0 FROM Appraisal a WHERE " +
           "a.formSet.selfAssessmentForm.formId = :formId OR " +
           "a.formSet.managerEvaluationForm.formId = :formId")
    boolean existsByFormIdInFormSet(Long formId);
 
    boolean existsByFormSet_Id(Long formSetId);
 
    @Query("SELECT a FROM Appraisal a JOIN EmployeeDepartment ed ON a.employee.id = ed.employee.id " +
            "WHERE ed.currentDepartment.id = :departmentId AND ed.isCurrent = true")
    List<Appraisal> findByDepartmentId(Long departmentId);

    // --- Cycle closure queries ---
    List<Appraisal> findByCycle_CycleIdAndStatus(Long cycleId, AppraisalStatus status);

    @Query("SELECT a FROM Appraisal a WHERE a.cycle.cycleId = :cycleId AND a.status NOT IN :statuses")
    List<Appraisal> findByCycleIdAndStatusNotIn(@Param("cycleId") Long cycleId, @Param("statuses") List<AppraisalStatus> statuses);
}

