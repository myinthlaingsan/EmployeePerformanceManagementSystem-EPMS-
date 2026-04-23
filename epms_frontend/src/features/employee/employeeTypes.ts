export type Gender = "M" | "F";

export type MaritalStatus = "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";

export type EmployeeStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "TERMINATED";

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateEmployeeRequest {
  staffName: string;
  otherName?: string;
  email: string;
  phoneNo: string;
  stateCode?: number;
  township?: string;
  nrcType?: string;
  number?: string;
  gender?: Gender;
  dateOfBirth?: string; // ISO string (yyyy-MM-dd)
  positionId: number;
  levelId: number;
  salary?: number;
  currency?: string;
  roleId: number;
}

export interface SetPasswordRequest {
  password: string;
}

export interface UpdateEmployeeRequest {
  staffName: string;
  otherName?: string;
  stateCode?: number;
  township?: string;
  nrcType?: string;
  number?: string;

  gender?: Gender;
  race?: string;
  religion?: string;

  dateOfBirth?: string;
  birthPlace?: string;

  contactAddress?: string;
  permanentAddress?: string;

  email?: string;
  phoneNo?: string;

  maritalStatus?: MaritalStatus;
  spouseName?: string;
  fatherName?: string;

  department?: string;

  positionId: number;
  levelId: number;

  salary?: number;
  currency?: string;

  dateOfAppointment?: string;
  dateOfConfirmation?: string;
  dateOfPromotion?: string;

  status?: EmployeeStatus;
  isActive?: boolean;

  roleIds?: number[];
}

export interface UpdateProfileRequest {
  staffName: string;
  otherName?: string;

  contactAddress?: string;
  permanentAddress?: string;

  email?: string;
  phoneNo?: string;

  maritalStatus?: MaritalStatus;
  spouseName?: string;
  fatherName?: string;
}

export interface EmployeeResponse {
  id: number;
  employeeCode: string;
  staffName: string;
  email: string;
  phoneNo: string;
  positionName: string;
  levelName: string;
  levelRank: number;
  roles: string[];
  permissions: string[];
}