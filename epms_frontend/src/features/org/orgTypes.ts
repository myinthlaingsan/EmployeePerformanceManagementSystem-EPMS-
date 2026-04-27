export interface DepartmentRequest {
  departmentCode: string;
  departmentName: string;
}

export interface DepartmentResponse {
  id: number;
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
}

export interface RoleRequest {
  roleName: string; // Using string to match RoleType enum name
}

export interface RoleResponse {
  roleId: number;
  roleName: string;
}

export interface JobLevelRequest {
  levelCode: string;
  levelName: string;
  levelRank: number;
}

export interface JobLevelResponse {
  levelId: number;
  levelCode: string;
  levelName: string;
  levelRank: number;
}

export interface PositionRequest {
  positionCode: string;
  positionName: string;
  levelId: number;
}

export interface PositionResponse {
  positionId: number;
  positionCode: string;
  positionName: string;
  levelId: number;
  levelName: string;
}

export interface AssignDepartmentRequest {
  currentDepartmentId: number;
  parentDepartmentId?: number;
}

export interface AssignRoleRequest {
  roleId: number;
}

export interface EmployeeDepartmentResponse {
  id: number;
  employeeId: number;
  currentDepartmentId: number;
  currentDepartmentName: string;
  parentDepartmentId?: number;
  parentDepartmentName?: string;
  isCurrent: boolean;
  createdAt: string; // ISO string
}

export interface PermissionRequest {
  permissionName: string;
}

export interface PermissionResponse {
  permissionId: number;
  permissionName: string;
}

export interface AssignPermissionRequest {
  roleId: number;
  levelId: number;
  permissionId: number;
}

export interface RoleLevelPermissionResponse {
  id: number;
  roleId: number;
  roleName: string;
  levelId: number;
  levelName: string;
  permissionId: number;
  permissionName: string;
}

