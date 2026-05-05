import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCreateEmployeeMutation, useGetEmployeeByIdQuery, useUpdateEmployeeMutation } from "../../features/employee/employeeapi";
import { useGetPositionsByDepartmentQuery } from "../../features/org/positionApi";
import { useGetRolesQuery } from "../../features/org/roleApi";
import { useGetActiveDepartmentsQuery } from "../../features/org/departmentApi";
import type { CreateEmployeeRequest, UpdateEmployeeRequest, Gender, MaritalStatus, EmployeeStatus } from "../../features/employee/employeeTypes";

const EmployeeForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: employeeData, isLoading: isLoadingEmployee } = useGetEmployeeByIdQuery(Number(id), { skip: !isEdit });
  const { data: roles } = useGetRolesQuery();
  const { data: departments } = useGetActiveDepartmentsQuery();
  
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();

  const [formData, setFormData] = useState<Partial<CreateEmployeeRequest & UpdateEmployeeRequest>>({
    staffName: "",
    otherName: "",
    email: "",
    phoneNo: "",
    positionId: 0,
    roleId: 0,
    parentDepartmentId: 0,
    currentDepartmentId: 0,
    stateCode: undefined,
    township: "",
    nrcType: "",
    number: "",
    gender: undefined,
    dateOfBirth: "",
    salary: undefined,
    currency: "MMK",
    // Update specific fields
    race: "",
    religion: "",
    birthPlace: "",
    contactAddress: "",
    permanentAddress: "",
    maritalStatus: undefined,
    spouseName: "",
    fatherName: "",
    dateOfAppointment: "",
    dateOfConfirmation: "",
    dateOfPromotion: "",
    status: undefined,
  });

  const [selectedPositionLevel, setSelectedPositionLevel] = useState("");

  const { data: positions } = useGetPositionsByDepartmentQuery(
    formData.currentDepartmentId || 0,
    { skip: !formData.currentDepartmentId }
  );

  useEffect(() => {
    if (isEdit && employeeData) {
      setFormData(prev => ({
        ...prev,
        ...employeeData, // this merges simple matching fields
        positionId: positions?.find(p => p.positionName === employeeData.positionName)?.positionId || 0,
      }));
      setSelectedPositionLevel(employeeData.levelName);
    }
  }, [isEdit, employeeData, positions, departments]);

  // Auto-sync Level with Position
  const handlePositionChange = (posId: number) => {
    const pos = positions?.find(p => p.positionId === posId);
    if (pos) {
      setFormData(prev => ({ ...prev, positionId: posId }));
      setSelectedPositionLevel(pos.levelName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        // Strip out fields not in UpdateEmployeeRequest if necessary, or just cast
        await updateEmployee({ id: Number(id), body: formData as UpdateEmployeeRequest }).unwrap();
      } else {
        await createEmployee(formData as CreateEmployeeRequest).unwrap();
      }
      navigate("/employees");
    } catch (err) {
      console.error("Failed to save employee", err);
    }
  };

  if (isEdit && isLoadingEmployee) return <div className="p-8 text-center text-gray-500">Loading employee details...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? "Edit Staff Member" : "Register New Staff Member"}</h1>
          <p className="text-gray-500 mt-1">
            {isEdit ? "Update the employee's comprehensive profile and organizational details." : "Fill in the required information to onboard a new employee to the system."}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Information Card */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name *</label>
              <input type="text" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.staffName || ""} onChange={e => setFormData({ ...formData, staffName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Other Name</label>
              <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.otherName || ""} onChange={e => setFormData({ ...formData, otherName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email Address *</label>
              <input type="email" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number *</label>
              <input type="text" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.phoneNo || ""} onChange={e => setFormData({ ...formData, phoneNo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Gender</label>
              <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.gender || ""} onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}>
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Birth</label>
              <input type="date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-gray-700"
                value={formData.dateOfBirth || ""} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Organizational Information Card */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Organizational Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Position *</label>
              <select required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={formData.positionId || ""} onChange={e => handlePositionChange(Number(e.target.value))}>
                <option value="">Select Position</option>
                {positions?.map(pos => <option key={pos.positionId} value={pos.positionId}>{pos.positionName}</option>)}
              </select>
              {selectedPositionLevel && <p className="text-xs text-indigo-600 mt-1 font-bold px-1">Level: {selectedPositionLevel}</p>}
            </div>

            {!isEdit && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Current Department (ERP) *</label>
                  <select required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={formData.currentDepartmentId || ""} 
                    onChange={e => {
                      setFormData({ 
                        ...formData, 
                        currentDepartmentId: Number(e.target.value),
                        positionId: 0 // Reset position when department changes
                      });
                      setSelectedPositionLevel("");
                    }}>
                    <option value="">Select Current Dept</option>
                    {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parent Department (Banking) *</label>
                  <select required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={formData.parentDepartmentId || ""} onChange={e => setFormData({ ...formData, parentDepartmentId: Number(e.target.value) })}>
                    <option value="">Select Parent Dept</option>
                    {departments?.map(dept => <option key={dept.id} value={dept.id}>{dept.departmentName}</option>)}
                  </select>
                </div>
              </>
            )}

            {!isEdit && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Primary Role *</label>
                <select required className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={formData.roleId || ""} onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })}>
                  <option value="">Select Role</option>
                  {roles?.map(role => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Salary Base</label>
              <div className="flex gap-2">
                <input type="number" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="0.00" value={formData.salary || ""} onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })} />
                <select className="w-24 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={formData.currency || "MMK"} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                  <option value="MMK">MMK</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
            </div>

            {isEdit && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Status</label>
                <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  value={formData.status || ""} onChange={e => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}>
                  <option value="">Select Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* NRC Information Card */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Identification (NRC)
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">State Code</label>
              <input type="number" placeholder="1-14" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={formData.stateCode || ""} onChange={e => setFormData({ ...formData, stateCode: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Township</label>
              <input type="text" placeholder="MaGaWa" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition uppercase"
                value={formData.township || ""} onChange={e => setFormData({ ...formData, township: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Type</label>
              <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={formData.nrcType || "(N)"} onChange={e => setFormData({ ...formData, nrcType: e.target.value })}>
                <option value="(N)">(N)</option>
                <option value="(E)">(E)</option>
                <option value="(P)">(P)</option>
                <option value="(T)">(T)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Number</label>
              <input type="text" placeholder="123456" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                value={formData.number || ""} onChange={e => setFormData({ ...formData, number: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Extended Information (Only shown during Edit) */}
        {isEdit && (
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
              Extended Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Address</label>
                <textarea className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition resize-none h-24"
                  value={formData.contactAddress || ""} onChange={e => setFormData({ ...formData, contactAddress: e.target.value })}></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Permanent Address</label>
                <textarea className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition resize-none h-24"
                  value={formData.permanentAddress || ""} onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}></textarea>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Marital Status</label>
                <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.maritalStatus || ""} onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as MaritalStatus })}>
                  <option value="">Select Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Spouse Name</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.spouseName || ""} onChange={e => setFormData({ ...formData, spouseName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Father's Name</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.fatherName || ""} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Birth Place</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.birthPlace || ""} onChange={e => setFormData({ ...formData, birthPlace: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Race</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.race || ""} onChange={e => setFormData({ ...formData, race: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Religion</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition"
                  value={formData.religion || ""} onChange={e => setFormData({ ...formData, religion: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Appointment</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-gray-700"
                  value={formData.dateOfAppointment || ""} onChange={e => setFormData({ ...formData, dateOfAppointment: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Confirmation</label>
                <input type="date" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-gray-700"
                  value={formData.dateOfConfirmation || ""} onChange={e => setFormData({ ...formData, dateOfConfirmation: e.target.value })} />
              </div>
            </div>
          </section>
        )}

        {/* Form Actions */}
        <div className="flex justify-end items-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate("/employees")}
            className="px-8 py-3.5 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="px-10 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-xl shadow-gray-300 disabled:opacity-50 flex items-center gap-2"
          >
            {(isCreating || isUpdating) ? "Saving..." : (isEdit ? "Update Employee" : "Register Employee")}
            {!(isCreating || isUpdating) && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
