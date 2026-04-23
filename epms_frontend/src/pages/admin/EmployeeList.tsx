import { useGetEmployeesQuery, useDeleteEmployeeMutation } from "../../features/employee/employeeapi";
import { Link } from "react-router-dom";

const EmployeeList = () => {
  const { data: employees, isLoading, error } = useGetEmployeesQuery();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  if (isLoading) return <div className="p-8 text-center">Loading employees...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading employees.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <Link
          to="/employees/new"
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Add Employee
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Position & Level</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees?.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-mono text-gray-600">{emp.employeeCode}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{emp.staffName}</div>
                  <div className="text-xs text-gray-500">{emp.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {emp.positionName} ({emp.levelName})
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {emp.roles.map(role => (
                      <span key={role} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                        {role.replace('ROLE_', '')}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right space-x-3">
                  <Link
                    to={`/employees/edit/${emp.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeList;
