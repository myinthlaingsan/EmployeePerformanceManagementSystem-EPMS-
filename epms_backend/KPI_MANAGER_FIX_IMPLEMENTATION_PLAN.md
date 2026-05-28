# KPI Manager Assignment Fix - Complete Implementation Plan

**Date:** May 21, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation  
**Effort:** 7-10 hours  
**Risk Level:** Low

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Phase 1: Database Changes](#phase-1-database-changes)
4. [Phase 2: Backend Implementation](#phase-2-backend-implementation)
5. [Phase 3: Frontend Implementation](#phase-3-frontend-implementation)
6. [Phase 4: Testing Strategy](#phase-4-testing-strategy)
7. [Phase 5: Deployment & Rollback](#phase-5-deployment--rollback)
8. [Timeline & Checklist](#timeline--checklist)

---

## Problem Statement

### Current Issue
When an HR/Admin user assigns KPI goals to an employee:
- The system stores the **HR user's ID and name** as the goal's manager
- The employee's **actual manager** (from organizational hierarchy) is ignored
- The Goal Detail page shows the wrong person as the manager

### Impact
- **Incorrect approval authority**: Wrong manager might approve/reject goals
- **Audit trail confusion**: Doesn't distinguish between assigner (HR) and manager (employee's boss)
- **Reporting accuracy**: Manager dashboards show incorrect data
- **Compliance risk**: Audit trails don't show who actually assigned the goals

### Root Cause
In `KpiGoalServiceImpl.assignKpiToEmployee()`:
```java
// WRONG: Uses current logged-in user (HR) as manager
kpiGoal.setManagerId(currentUser.getId());
kpiGoal.setManagerName(currentUser.getName());
```

Should use employee's actual manager from ReportingLine table.

---

## Solution Overview

### Design Decision
Introduce two distinct concepts in the `KpiGoals` entity:

| Field | Purpose | Current Behavior | New Behavior |
|-------|---------|------------------|--------------|
| `managerId` | Employee's actual manager | ❌ Stores HR user | ✅ Stores employee's manager from ReportingLine |
| `assignedBy` (NEW) | Who assigned the goals | Not tracked | ✅ Stores HR/Manager who performed assignment |
| `assignedAt` (NEW) | When goals were assigned | Not tracked | ✅ Stores assignment timestamp |

### Data Flow (Before vs After)

**BEFORE:**
```
HR assigns goal to Employee A
  ↓
KpiGoal.managerId = HR_ID  ❌ WRONG
KpiGoal.managerName = "HR Name"  ❌ WRONG
(Employee A's actual manager is ignored)
```

**AFTER:**
```
HR assigns goal to Employee A
  ↓
1. Fetch Employee A's manager from ReportingLineRepository
  ↓
2. KpiGoal.managerId = ACTUAL_MANAGER_ID  ✅ CORRECT
   KpiGoal.managerName = "Manager Name"  ✅ CORRECT
  ↓
3. KpiGoal.assignedBy = HR_ID  ✅ NEW - Track assigner
   KpiGoal.assignedAt = TIMESTAMP  ✅ NEW - Track when
```

---

## Phase 1: Database Changes

### Step 1.1: Create Migration File

**File:** `src/main/resources/db/migration/V[VERSION]__Add_KPI_Goal_Assignment_Tracking.sql`

**Version Number Strategy:**
- Check your existing migrations: `ls src/main/resources/db/migration/`
- If last migration is `V20__xxx`, then use `V21__xxx`
- If using timestamp, use: `V20260521123000__Add_KPI_Goal_Assignment_Tracking.sql`

```sql
-- ============================================
-- Add assignment tracking to kpi_goals table
-- ============================================

-- Add new columns to track who assigned the goals
ALTER TABLE kpi_goals ADD COLUMN assigned_by BIGINT;
ALTER TABLE kpi_goals ADD COLUMN assigned_by_name VARCHAR(255);
ALTER TABLE kpi_goals ADD COLUMN assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_kpi_goals_assigned_by ON kpi_goals(assigned_by);
CREATE INDEX idx_kpi_goals_assigned_at ON kpi_goals(assigned_at);

-- Update existing records (backfill data)
-- For existing goals, assume the creator is the assigner
UPDATE kpi_goals 
SET 
    assigned_by = created_by,
    assigned_by_name = COALESCE(manager_name, 'Unknown'),
    assigned_at = COALESCE(created_date, CURRENT_TIMESTAMP)
WHERE assigned_by IS NULL;

-- Add foreign key constraint (optional but recommended)
ALTER TABLE kpi_goals 
ADD CONSTRAINT fk_kpi_goals_assigned_by 
FOREIGN KEY (assigned_by) REFERENCES employees(id) ON DELETE SET NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE kpi_goals MODIFY assigned_by BIGINT NOT NULL;
ALTER TABLE kpi_goals MODIFY assigned_by_name VARCHAR(255) NOT NULL;
```

### Step 1.2: Verify Migration

```bash
# Run the migration
mvn flyway:migrate

# Verify the changes
mysql> DESC kpi_goals;
# Should show: assigned_by, assigned_by_name, assigned_at columns

# Check existing data
mysql> SELECT id, manager_id, manager_name, assigned_by, assigned_by_name FROM kpi_goals LIMIT 5;
```

---

## Phase 2: Backend Implementation

### Step 2.1: Update KpiGoals Entity

**File:** `src/main/java/com/epms/entity/KpiGoals.java`

**Current Code:**
```java
@Entity
@Table(name = "kpi_goals")
public class KpiGoals {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "employee_id")
    private Long employeeId;
    
    @Column(name = "manager_id")
    private Long managerId;
    
    @Column(name = "manager_name")
    private String managerName;
    
    @Column(name = "status")
    private String status;
    
    // ... other fields
}
```

**Updated Code - ADD these fields:**
```java
@Entity
@Table(name = "kpi_goals")
public class KpiGoals {
    // ... existing fields above ...
    
    @Column(name = "assigned_by")
    private Long assignedBy;
    
    @Column(name = "assigned_by_name")
    private String assignedByName;
    
    @Column(name = "assigned_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date assignedAt;
    
    // Getters and Setters
    public Long getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(Long assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public String getAssignedByName() {
        return assignedByName;
    }
    
    public void setAssignedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }
    
    public Date getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(Date assignedAt) {
        this.assignedAt = assignedAt;
    }
}
```

### Step 2.2: Update KpiGoalDTO

**File:** `src/main/java/com/epms/dto/KpiGoalDTO.java`

**Add these fields to the DTO:**
```java
public class KpiGoalDTO {
    // ... existing fields ...
    
    private Long assignedBy;
    private String assignedByName;
    private Date assignedAt;
    
    // Getters and Setters
    public Long getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(Long assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public String getAssignedByName() {
        return assignedByName;
    }
    
    public void setAssignedByName(String assignedByName) {
        this.assignedByName = assignedByName;
    }
    
    public Date getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(Date assignedAt) {
        this.assignedAt = assignedAt;
    }
}
```

### Step 2.3: Update KpiMapper

**File:** `src/main/java/com/epms/mapper/KpiMapper.java`

**Update the mapping method:**
```java
public class KpiMapper {
    
    public KpiGoalDTO mapKpiGoalToDTO(KpiGoals kpiGoal) {
        if (kpiGoal == null) {
            return null;
        }
        
        KpiGoalDTO dto = new KpiGoalDTO();
        // ... existing mappings ...
        dto.setManagerId(kpiGoal.getManagerId());
        dto.setManagerName(kpiGoal.getManagerName());
        
        // ADD these new mappings
        dto.setAssignedBy(kpiGoal.getAssignedBy());
        dto.setAssignedByName(kpiGoal.getAssignedByName());
        dto.setAssignedAt(kpiGoal.getAssignedAt());
        
        return dto;
    }
    
    public KpiGoals mapDTOToKpiGoal(KpiGoalDTO dto) {
        if (dto == null) {
            return null;
        }
        
        KpiGoals goal = new KpiGoals();
        // ... existing mappings ...
        goal.setManagerId(dto.getManagerId());
        goal.setManagerName(dto.getManagerName());
        
        // ADD these new mappings
        goal.setAssignedBy(dto.getAssignedBy());
        goal.setAssignedByName(dto.getAssignedByName());
        goal.setAssignedAt(dto.getAssignedAt());
        
        return goal;
    }
}
```

### Step 2.4: FIX the Core Assignment Logic

**File:** `src/main/java/com/epms/service/impl/KpiGoalServiceImpl.java`

**Current Code (WRONG):**
```java
public ApiResponse<KpiGoalDTO> assignKpiToEmployee(KpiAssignmentRequest request, 
                                                   AuthUser currentUser) {
    // ... validation code ...
    
    KpiGoals kpiGoal = new KpiGoals();
    kpiGoal.setEmployeeId(request.getEmployeeId());
    kpiGoal.setManagerId(currentUser.getId());  // ❌ WRONG: Uses current user (HR)
    kpiGoal.setManagerName(currentUser.getName());  // ❌ WRONG
    kpiGoal.setStatus(KpiGoalStatus.DRAFT.name());
    
    // ... save and return ...
}
```

**Updated Code (CORRECT):**
```java
@Autowired
private ReportingLineRepository reportingLineRepository;  // Add this if missing

public ApiResponse<KpiGoalDTO> assignKpiToEmployee(KpiAssignmentRequest request, 
                                                   AuthUser currentUser) {
    // ... existing validation code ...
    
    // ✅ NEW: Fetch employee's actual manager
    Employee targetEmployee = employeeRepository.findById(request.getEmployeeId())
        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    
    // Get the employee's actual manager from ReportingLine
    ReportingLine reportingLine = reportingLineRepository
        .findByEmployeeId(request.getEmployeeId())
        .orElseThrow(() -> new ResourceNotFoundException(
            "Reporting line not found for employee. Please set manager in org structure."));
    
    Employee actualManager = reportingLine.getManagerId();
    
    // Create the goal with CORRECT manager
    KpiGoals kpiGoal = new KpiGoals();
    kpiGoal.setEmployeeId(request.getEmployeeId());
    kpiGoal.setManagerId(actualManager.getId());          // ✅ CORRECT: Employee's manager
    kpiGoal.setManagerName(actualManager.getName());      // ✅ CORRECT
    
    // ✅ NEW: Track who assigned the goals
    kpiGoal.setAssignedBy(currentUser.getId());          // ✅ Track the assigner (HR)
    kpiGoal.setAssignedByName(currentUser.getName());    // ✅ Track assigner's name
    kpiGoal.setAssignedAt(new Date());                   // ✅ Track timestamp
    
    kpiGoal.setStatus(KpiGoalStatus.DRAFT.name());
    
    // ... rest of the method (copy items, save, etc.) ...
    
    KpiGoals savedGoal = kpiGoalsRepository.save(kpiGoal);
    return ApiResponse.success(mapToDTO(savedGoal));
}
```

### Step 2.5: Update Bulk Assignment

**File:** `src/main/java/com/epms/service/impl/KpiGoalServiceImpl.java`

**Method:** `bulkAssignKpi()`

```java
public ApiResponse<BulkAssignmentResponse> bulkAssignKpi(BulkAssignmentRequest request,
                                                         AuthUser currentUser) {
    // ... existing code ...
    
    for (Long employeeId : request.getEmployeeIds()) {
        try {
            // ✅ Fetch employee's actual manager
            ReportingLine reportingLine = reportingLineRepository
                .findByEmployeeId(employeeId)
                .orElse(null);
            
            if (reportingLine == null) {
                result.addSkipped(employeeId, "Reporting line not configured");
                continue;
            }
            
            Employee actualManager = reportingLine.getManagerId();
            
            KpiGoals kpiGoal = new KpiGoals();
            kpiGoal.setEmployeeId(employeeId);
            kpiGoal.setManagerId(actualManager.getId());      // ✅ CORRECT
            kpiGoal.setManagerName(actualManager.getName());  // ✅ CORRECT
            
            // ✅ Track assigner
            kpiGoal.setAssignedBy(currentUser.getId());
            kpiGoal.setAssignedByName(currentUser.getName());
            kpiGoal.setAssignedAt(new Date());
            
            kpiGoal.setStatus(KpiGoalStatus.DRAFT.name());
            // ... rest of logic ...
            
        } catch (Exception e) {
            result.addFailed(employeeId, e.getMessage());
        }
    }
    
    return ApiResponse.success(result);
}
```

### Step 2.6: Update API Response

**File:** `src/main/java/com/epms/controller/KpiController.java`

The API response doesn't need changes, but verify the GET endpoints include the new fields:

```java
@GetMapping("/goal-set/{id}")
public ApiResponse<KpiGoalDTO> getGoalSetById(@PathVariable Long id) {
    KpiGoals goal = kpiGoalsRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Goal not found"));
    
    return ApiResponse.success(kpiMapper.mapKpiGoalToDTO(goal));
    // This will now include assignedBy, assignedByName, assignedAt
}
```

---

## Phase 3: Frontend Implementation

### Step 3.1: Update TypeScript Types

**File:** `src/types/kpi.ts` or your type definition file

```typescript
// Add to KpiGoal interface
export interface KpiGoal {
  id: number;
  employeeId: number;
  managerId: number;
  managerName: string;
  
  // ✅ NEW FIELDS
  assignedBy?: number;
  assignedByName?: string;
  assignedAt?: string; // ISO timestamp
  
  // ... other existing fields ...
  status: 'DRAFT' | 'APPROVED' | 'LOCKED' | 'ARCHIVED';
  items: KpiGoalItem[];
}
```

### Step 3.2: Update GoalAssignmentWorkspace Component

**File:** `src/pages/kpi/GoalAssignmentWorkspace.tsx`

**In the header section, ADD:**
```typescript
// In the component render, find the employee info card and add:
<div className="flex justify-between items-start">
  <div>
    <h2 className="text-2xl font-bold">{employee.name}</h2>
    <p className="text-gray-600">{employee.employeeCode}</p>
  </div>
  
  {/* ✅ ADD THIS SECTION - Show assignment info */}
  {goalSet && (
    <div className="bg-blue-50 border border-blue-200 rounded p-3">
      <p className="text-sm text-gray-700">
        <strong>Assigned by:</strong> {goalSet.assignedByName}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Assigned on:</strong> {new Date(goalSet.assignedAt).toLocaleDateString()}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Employee Manager:</strong> {goalSet.managerName}
      </p>
    </div>
  )}
</div>
```

### Step 3.3: Update GoalDetail Component

**File:** `src/pages/kpi/GoalDetail.tsx`

**Find the metadata section and ADD:**
```typescript
{/* ✅ ADD THIS - Assignment and Manager Information */}
<div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
  
  {/* Manager Information */}
  <div>
    <h3 className="text-sm font-semibold text-gray-700 mb-2">Manager</h3>
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="font-medium text-gray-900">{goalSet.managerName}</p>
      <p className="text-xs text-gray-500">ID: {goalSet.managerId}</p>
      <p className="text-xs text-gray-500 mt-1">
        Employee's direct manager for approval authority
      </p>
    </div>
  </div>
  
  {/* Assignment Information */}
  <div>
    <h3 className="text-sm font-semibold text-gray-700 mb-2">Assignment Details</h3>
    <div className="bg-white p-3 rounded border border-gray-200">
      <p className="text-sm text-gray-700">
        <strong>Assigned by:</strong> {goalSet.assignedByName}
      </p>
      <p className="text-xs text-gray-500 mt-1">ID: {goalSet.assignedBy}</p>
      <p className="text-xs text-gray-500 mt-1">
        <strong>Date:</strong> {new Date(goalSet.assignedAt).toLocaleString()}
      </p>
    </div>
  </div>
  
</div>
```

### Step 3.4: Update GoalManagement Component

**File:** `src/pages/kpi/GoalManagement.tsx`

**In the employee table, ADD column:**
```typescript
// In the table headers
<thead>
  <tr>
    <th>Name</th>
    <th>Position</th>
    <th>Manager</th>  {/* ✅ NEW COLUMN */}
    <th>Goal Status</th>
    <th>Assigned By</th>  {/* ✅ NEW COLUMN */}
    <th>Action</th>
  </tr>
</thead>

// In the table body
<tbody>
  {employees.map(emp => (
    <tr key={emp.id}>
      <td>{emp.name}</td>
      <td>{emp.position}</td>
      <td>{emp.managerName}</td>  {/* ✅ Show actual manager */}
      <td>{goalSet?.status || 'Not Assigned'}</td>
      <td>{goalSet?.assignedByName || '-'}</td>  {/* ✅ Show assigner */}
      <td>
        <button onClick={() => navigateToAssign(emp.id)}>
          Assign/Edit
        </button>
      </td>
    </tr>
  ))}
</tbody>
```

### Step 3.5: Update RTK Query API Slice

**File:** `src/api/kpiSlice.ts` or `src/services/kpiApi.ts`

No code changes needed - the API already returns the new fields. They'll automatically be included in the response.

---

## Phase 4: Testing Strategy

### 4.1: Unit Tests - Backend

**File:** `src/test/java/com/epms/service/KpiGoalServiceImplTest.java`

```java
@SpringBootTest
class KpiGoalServiceImplTest {
    
    @Autowired
    private KpiGoalService kpiGoalService;
    
    @MockBean
    private ReportingLineRepository reportingLineRepository;
    
    @MockBean
    private EmployeeRepository employeeRepository;
    
    @MockBean
    private KpiGoalsRepository kpiGoalsRepository;
    
    /**
     * Test Case 1: HR assigns goals - manager should be from ReportingLine
     */
    @Test
    void testAssignKpiToEmployee_SetsCorrectManager() {
        // Arrange
        Long employeeId = 1L;
        Long actualManagerId = 2L;
        String actualManagerName = "John Manager";
        Long hrUserId = 3L;
        String hrName = "HR User";
        
        Employee targetEmployee = new Employee();
        targetEmployee.setId(employeeId);
        targetEmployee.setName("John Employee");
        
        Employee actualManager = new Employee();
        actualManager.setId(actualManagerId);
        actualManager.setName(actualManagerName);
        
        ReportingLine reportingLine = new ReportingLine();
        reportingLine.setEmployeeId(employeeId);
        reportingLine.setManagerId(actualManagerId);
        
        AuthUser hrUser = new AuthUser();
        hrUser.setId(hrUserId);
        hrUser.setName(hrName);
        
        KpiAssignmentRequest request = new KpiAssignmentRequest();
        request.setEmployeeId(employeeId);
        request.setLibraryId(1L);
        request.setCycleId(1L);
        
        // Mock dependencies
        when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(targetEmployee));
        when(reportingLineRepository.findByEmployeeId(employeeId))
            .thenReturn(Optional.of(reportingLine));
        when(employeeRepository.findById(actualManagerId))
            .thenReturn(Optional.of(actualManager));
        when(kpiGoalsRepository.save(any()))
            .thenAnswer(invocation -> invocation.getArgument(0));
        
        // Act
        ApiResponse<KpiGoalDTO> response = kpiGoalService.assignKpiToEmployee(request, hrUser);
        
        // Assert
        KpiGoalDTO result = response.getData();
        
        // ✅ Verify manager is from ReportingLine (NOT HR)
        assertEquals(actualManagerId, result.getManagerId(),
            "Manager should be from ReportingLine, not the current user");
        assertEquals(actualManagerName, result.getManagerName());
        
        // ✅ Verify assigner is tracked
        assertEquals(hrUserId, result.getAssignedBy(),
            "AssignedBy should be the HR user who performed the assignment");
        assertEquals(hrName, result.getAssignedByName());
        
        // ✅ Verify timestamp is set
        assertNotNull(result.getAssignedAt(), "AssignedAt should be set");
    }
    
    /**
     * Test Case 2: Bulk assign - each employee gets their own manager
     */
    @Test
    void testBulkAssignKpi_EachEmployeeGetsOwnManager() {
        // Arrange - setup two employees with different managers
        Long emp1Id = 1L;
        Long emp2Id = 2L;
        Long manager1Id = 10L;
        Long manager2Id = 11L;
        
        // ... setup mocks for both employees with different managers ...
        
        // Act
        BulkAssignmentRequest request = new BulkAssignmentRequest();
        request.setEmployeeIds(Arrays.asList(emp1Id, emp2Id));
        request.setLibraryId(1L);
        
        // Assert
        // Verify each employee was assigned their own manager, not HR's ID
    }
    
    /**
     * Test Case 3: Missing reporting line should fail gracefully
     */
    @Test
    void testAssignKpiToEmployee_MissingReportingLine_ThrowsException() {
        // Arrange
        when(reportingLineRepository.findByEmployeeId(any()))
            .thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            kpiGoalService.assignKpiToEmployee(request, hrUser);
        });
    }
}
```

### 4.2: Integration Tests

**File:** `src/test/java/com/epms/integration/KpiAssignmentIntegrationTest.java`

```java
@SpringBootTest
@AutoConfigureMockMvc
class KpiAssignmentIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private TestDataSetup testDataSetup;
    
    /**
     * Integration Test: Full flow from assignment to detail view
     */
    @Test
    void testKpiAssignmentFlow_EndToEnd() throws Exception {
        // Setup test data
        Employee hrUser = testDataSetup.createEmployee("HR User", "HR");
        Employee employee = testDataSetup.createEmployee("John Employee", "EMPLOYEE");
        Employee manager = testDataSetup.createEmployee("Jane Manager", "MANAGER");
        
        testDataSetup.createReportingLine(employee, manager);
        KpiLibrary library = testDataSetup.createKpiLibrary("Standard KPI");
        AppraisalCycle cycle = testDataSetup.createAppraisalCycle();
        
        // Step 1: HR assigns goal
        KpiAssignmentRequest request = new KpiAssignmentRequest();
        request.setEmployeeId(employee.getId());
        request.setLibraryId(library.getId());
        request.setCycleId(cycle.getId());
        
        mockMvc.perform(post("/api/v1/kpi/assign")
            .header("Authorization", "Bearer " + getHRToken(hrUser))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());
        
        // Step 2: Retrieve goal and verify
        mockMvc.perform(get("/api/v1/kpi/goal-set/employee/{id}", employee.getId())
            .header("Authorization", "Bearer " + getHRToken(hrUser)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.managerId").value(manager.getId()))
            .andExpect(jsonPath("$.data.managerName").value("Jane Manager"))
            .andExpect(jsonPath("$.data.assignedBy").value(hrUser.getId()))
            .andExpect(jsonPath("$.data.assignedByName").value("HR User"))
            .andExpect(jsonPath("$.data.assignedAt").exists());
    }
}
```

### 4.3: Manual Testing Checklist

**Scenario 1: Single Assignment**
- [ ] HR logs in
- [ ] HR navigates to KPI Assignment page
- [ ] HR selects an employee
- [ ] HR assigns a KPI library
- [ ] Check Goal Detail page:
  - [ ] Manager field shows employee's actual manager (from org chart)
  - [ ] "Assigned by" shows the HR user's name
  - [ ] "Assigned on" shows the current date/time
- [ ] Check Goal Management page:
  - [ ] Manager column shows correct manager
  - [ ] Assigned By column shows HR name

**Scenario 2: Bulk Assignment**
- [ ] HR navigates to Team Management
- [ ] HR selects multiple employees with DIFFERENT managers
- [ ] HR performs bulk assignment
- [ ] For each employee, verify:
  - [ ] Goal Detail shows their individual manager (not all the same)
  - [ ] All show same "Assigned by" (the HR user)

**Scenario 3: Manager Approval View**
- [ ] Manager logs in
- [ ] Manager navigates to Team KPI Dashboard
- [ ] Verify it shows goals for their direct reports
- [ ] Manager can see which HR assigned the goals
- [ ] Manager can approve/reject appropriately

**Scenario 4: Audit Trail**
- [ ] View Goal Audit Log
- [ ] Verify "KPI_ASSIGNED" event shows:
  - [ ] Correct manager ID
  - [ ] Who performed the assignment (assignedBy)
  - [ ] When it was assigned

---

## Phase 5: Deployment & Rollback

### 5.1: Pre-Deployment Checklist

- [ ] All unit tests pass: `mvn clean test`
- [ ] All integration tests pass: `mvn clean verify`
- [ ] Code review approved
- [ ] Database migration tested on staging: `mvn flyway:migrate`
- [ ] Frontend builds without errors: `npm run build`
- [ ] No console errors in browser DevTools
- [ ] Manual testing completed (all scenarios above)
- [ ] Performance impact assessed (see below)

### 5.2: Performance Impact Analysis

**Database Changes:**
- Adding 3 columns: ~12 bytes per record
- Adding 2 indexes: ~100KB each (negligible)
- Backfill update: One-time operation (< 1 second for typical 10K records)

**Query Impact:**
- SELECT queries: No change (columns not in WHERE clause usually)
- INSERT queries: Minimal change (3 extra columns)
- UPDATE queries: Minimal change

**Recommendation:** No performance issues expected. Safe to deploy.

### 5.3: Deployment Steps

**Step 1: Database Migration**
```bash
# 1. Backup database
mysqldump -u root -p epms > backup_$(date +%s).sql

# 2. Apply migration
mvn clean flyway:migrate -DskipTests

# 3. Verify migration
mysql -u root -p epms -e "DESC kpi_goals;" | grep assigned
# Should show: assigned_by, assigned_by_name, assigned_at
```

**Step 2: Backend Deployment**
```bash
# 1. Build the application
mvn clean package -DskipTests

# 2. Backup current jar
cp target/epms.jar target/epms.jar.backup

# 3. Deploy new jar
cp target/epms.jar /opt/epms/epms.jar

# 4. Restart application
systemctl restart epms

# 5. Check logs
tail -f /var/log/epms/app.log | grep "Started\|ERROR"
```

**Step 3: Frontend Deployment**
```bash
# 1. Build frontend
npm run build

# 2. Backup current build
cp -r dist dist.backup

# 3. Deploy new build
cp -r dist/* /opt/epms/frontend/

# 4. Clear browser cache (or users refresh)
```

**Step 4: Verification**
```bash
# 1. Check API endpoint returns new fields
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/v1/kpi/goal-set/1 | jq '.data | {managerId, assignedBy, assignedByName, assignedAt}'

# 2. Assign a test goal via API/UI
# 3. Verify all three fields are populated
```

### 5.4: Rollback Plan (If Issues Occur)

**If deployment fails, execute rollback:**

```bash
# Step 1: Rollback database
mysql -u root -p epms < backup_[timestamp].sql

# Step 2: Rollback application
cp /opt/epms/target/epms.jar.backup /opt/epms/epms.jar
systemctl restart epms

# Step 3: Rollback frontend
cp -r /opt/epms/dist.backup/* /opt/epms/frontend/

# Step 4: Verify rollback successful
curl http://localhost:8080/api/v1/kpi/active-cycle
# Should respond normally
```

**Rollback is safe because:**
- Migration adds columns but doesn't delete anything
- Old code ignores the new columns (backward compatible)
- Can be rolled back any time without data loss

---

## Phase 6: Post-Deployment

### 6.1: Monitor for Issues

**First 24 hours:**
- [ ] Monitor error logs: `tail -f /var/log/epms/app.log | grep ERROR`
- [ ] Check database performance: Monitor slow query logs
- [ ] User feedback: No complaints about wrong managers in goals

**First week:**
- [ ] Audit 100 newly assigned goals
- [ ] Verify all have correct manager IDs
- [ ] Verify all have assignedBy populated
- [ ] Check manager approvals working correctly

### 6.2: Data Validation Script

Run this to validate data integrity:

```sql
-- Check for goals with missing assigned_by
SELECT id, employee_id, manager_id, assigned_by 
FROM kpi_goals 
WHERE assigned_by IS NULL 
AND created_date > DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Check for data consistency
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN assigned_by IS NOT NULL THEN 1 ELSE 0 END) as with_assigner,
  SUM(CASE WHEN manager_id != employee.id THEN 1 ELSE 0 END) as correct_manager
FROM kpi_goals kg
JOIN employees e ON kg.employee_id = e.id;
```

### 6.3: Update Documentation

- [ ] Update API documentation with new fields
- [ ] Update user guide: "Manager vs Assigned By"
- [ ] Update admin guide with deployment steps
- [ ] Add changelog entry

---

## Timeline & Checklist

### Estimated Timeline: 7-10 hours

| Phase | Task | Duration | Effort |
|-------|------|----------|--------|
| **1: Database** | Migration file + testing | 30 min | Low |
| **2: Backend** | Entity, DTO, Service, Mapper updates | 1.5 hours | Medium |
| **2: Backend** | Fix assignKpiToEmployee() logic | 1 hour | High |
| **2: Backend** | Fix bulkAssignKpi() logic | 1 hour | Medium |
| **3: Frontend** | Update types and components | 1 hour | Medium |
| **4: Testing** | Unit tests | 1.5 hours | Medium |
| **4: Testing** | Integration tests | 1 hour | Medium |
| **4: Testing** | Manual testing (all scenarios) | 1 hour | Low |
| **5: Deployment** | Deploy to staging | 30 min | Low |
| **5: Deployment** | Deploy to production | 30 min | Low |
| **6: Validation** | Data validation & monitoring | 1 hour | Low |
| **TOTAL** | | **~10 hours** | |

### Implementation Checklist

**Week 1: Development & Testing**
- [ ] Day 1: Database migration created and tested locally
- [ ] Day 1-2: Backend changes implemented
- [ ] Day 2: Frontend changes implemented
- [ ] Day 2-3: Unit and integration tests written and passing
- [ ] Day 3: Manual testing completed - all scenarios pass
- [ ] Day 3: Code review approved

**Week 2: Deployment**
- [ ] Day 1: Staging deployment - all verifications pass
- [ ] Day 1: Final stakeholder approval
- [ ] Day 2: Production deployment during maintenance window
- [ ] Day 2: Post-deployment monitoring
- [ ] Day 3-5: Validation and monitoring

---

## Key Points to Remember

✅ **Do:**
- Use ReportingLineRepository to get employee's manager
- Track who assigned goals in assignedBy field
- Test with employees having different managers
- Verify backward compatibility
- Monitor logs after deployment

❌ **Don't:**
- Use currentUser/LoggedInUser as the manager
- Skip the ReportingLine validation
- Forget to backfill assignedBy for existing goals
- Deploy without testing on staging first
- Forget to communicate changes to managers/HR

---

## Support & Questions

If you encounter any issues:

1. Check the troubleshooting section at the end
2. Review the code snippets document for exact implementations
3. Review logs: `/var/log/epms/app.log`
4. Database troubleshooting: Run the validation SQL script
5. Contact development team with:
   - Error message
   - Stack trace
   - Steps to reproduce
   - Environment (staging/prod)

---

## Appendix: Common Issues & Solutions

### Issue 1: "Reporting line not found" error
**Cause:** Employee doesn't have a manager assigned in the organizational structure  
**Solution:** 
```sql
-- Check if employee has reporting line
SELECT * FROM reporting_lines WHERE employee_id = [ID];

-- If empty, either:
-- 1. Assign manager through UI: HR → Org Management → Add Manager
-- 2. Or insert directly (not recommended):
-- INSERT INTO reporting_lines (employee_id, manager_id) VALUES (X, Y);
```

### Issue 2: Tests failing with "assignedBy not matching"
**Cause:** Mock not configured correctly  
**Solution:** Review Step 4.2 test setup - ensure ReportingLineRepository is mocked

### Issue 3: Frontend shows undefined for assignedByName
**Cause:** API response not including new fields  
**Solution:** 
- Clear browser cache
- Verify mapper is updated (Step 2.3)
- Restart backend application
- Check API response: `curl .../goal-set/1 | jq`

### Issue 4: Database migration fails
**Cause:** Column already exists or syntax error  
**Solution:**
```bash
# Check current schema
mysql> DESC kpi_goals;

# If columns exist, rename migration version and skip:
# - Rename migration file to V99__skip.sql
# - Add migration to flyway_schema_history: 
#   INSERT INTO flyway_schema_history (version, description, type) 
#   VALUES (99, 'Skip', 'SQL');
```

---

**Document Version:** 1.0  
**Last Updated:** May 21, 2026  
**Next Review:** After production deployment + 1 week
