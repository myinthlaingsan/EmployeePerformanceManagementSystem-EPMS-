import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateEmployeeMutation, useGetEmployeeByIdQuery, useUpdateEmployeeMutation } from "../../features/employee/employeeapi";
import { useGetPositionsQuery } from "../../features/org/positionApi";
import { useGetRolesQuery } from "../../features/org/roleApi";
import { useGetDepartmentsQuery } from "../../features/org/departmentApi";
import type { CreateEmployeeRequest, UpdateEmployeeRequest } from "../../features/employee/employeeTypes";

const EmployeeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: employeeData } = useGetEmployeeByIdQuery(Number(id), { skip: !isEdit });
  const { data: positions } = useGetPositionsQuery();
  const { data: roles } = useGetRolesQuery();
  const { data: departments } = useGetDepartmentsQuery();
  
  const [createEmployee] = useCreateEmployeeMutation();
  const [updateEmployee] = useUpdateEmployeeMutation();

  const [formData, setFormData] = useState<Partial<CreateEmployeeRequest>>({
    staffName: "",
    email: "",
    phoneNo: "",
    positionId: 0,
    levelId: 0,
    roleId: 0,
    departmentId: 0,
  });

  const [selectedPositionLevel, setSelectedPositionLevel] = useState("");

  useEffect(() => {
    if (isEdit && employeeData) {
      setFormData({
        staffName: employeeData.staffName,
        email: employeeData.email,
        phoneNo: employeeData.phoneNo,
        positionId: positions?.find(p => p.positionName === employeeData.positionName)?.positionId || 0,
        departmentId: departments?.find(d => d.departmentName === employeeData.departmentName)?.id || 0,
      });
      setSelectedPositionLevel(employeeData.levelName);
    }
  }, [isEdit, employeeData, positions, departments]);

  // Auto-sync Level with Position
  const handlePositionChange = (posId: number) => {
    const pos = positions?.find(p => p.positionId === posId);
    if (pos) {
      setFormData(prev => ({ ...prev, positionId: posId, levelId: pos.levelId }));
      setSelectedPositionLevel(pos.levelName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateEmployee({ id: Number(id), body: formData as UpdateEmployeeRequest }).unwrap();
      } else {
        await createEmployee(formData as CreateEmployeeRequest).unwrap();
      }
      navigate("/employees");
    } catch (err) {
      console.error("Failed to save employee", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">{isEdit ? "Edit Employee" : "Register New Employee"}</h1>
        <p className="text-gray-500 mt-1">Fill in the professional details for the staff member.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.staffName}
              onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.phoneNo}
              onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Position</label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.positionId}
              onChange={(e) => handlePositionChange(Number(e.target.value))}
            >
              <option value="">Select Position</option>
              {positions?.map(pos => (
                <option key={pos.positionId} value={pos.positionId}>{pos.positionName}</option>
              ))}
            </select>
            {selectedPositionLevel && (
              <p className="text-xs text-blue-600 mt-1 font-medium italic">Associated Level: {selectedPositionLevel}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Department</label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
            >
              <option value="">Select Department</option>
              {departments?.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Primary Role</label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
            >
              <option value="">Select Role</option>
              {roles?.map(role => (
                <option key={role.roleId} value={role.roleId}>{role.roleName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6 flex justify-end space-x-4 border-t">
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="px-6 py-3 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
          >
            {isEdit ? "Update Employee" : "Create Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
