package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.position p LEFT JOIN FETCH p.level LEFT JOIN FETCH e.level WHERE LOWER(TRIM(e.email)) = LOWER(:email)")
    Optional<Employee> findByEmail(String email);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.position p LEFT JOIN FETCH p.level LEFT JOIN FETCH e.level")
    List<Employee> findAll();

    @Query(value = "SELECT e FROM Employee e LEFT JOIN FETCH e.position p LEFT JOIN FETCH p.level LEFT JOIN FETCH e.level",
           countQuery = "SELECT COUNT(e) FROM Employee e")
    Page<Employee> findAllPaginated(Pageable pageable);

    @Query(value = "SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.position p " +
           "LEFT JOIN FETCH p.level " +
           "LEFT JOIN FETCH e.level " +
           "WHERE (:query IS NULL OR LOWER(e.staffName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')))",
           countQuery = "SELECT COUNT(e) FROM Employee e " +
                        "WHERE (:query IS NULL OR LOWER(e.staffName) LIKE LOWER(CONCAT('%', :query, '%')) " +
                        "OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :query, '%')) " +
                        "OR LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Employee> searchEmployees(@Param("query") String query, Pageable pageable);

    @Query("SELECT e FROM Employee e LEFT JOIN FETCH e.position p LEFT JOIN FETCH p.level LEFT JOIN FETCH e.level WHERE e.id = :id")
    Optional<Employee> findById(Long id);

    boolean existsByLevel(ace.org.epms_backend.model.employee.JobLevel level);

    boolean existsByPosition(ace.org.epms_backend.model.employee.Position position);
}
