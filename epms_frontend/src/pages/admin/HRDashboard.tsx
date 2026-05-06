import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { useGetDepartmentsQuery } from "../../features/org/departmentApi";
import { Link } from "react-router-dom";

const HRDashboard = () => {
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 100 });
  const { data: departments } = useGetDepartmentsQuery();

  const employees = employeeData?.content || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">HR Management Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of organizational personnel and structure.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 uppercase">Total Employees</div>
          <div className="text-4xl font-bold text-blue-600 mt-2">{employeeData?.totalElements || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 uppercase">Departments</div>
          <div className="text-4xl font-bold text-indigo-600 mt-2">{departments?.length || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 uppercase">Active Status</div>
          <div className="text-4xl font-bold text-green-600 mt-2">
            {employees.length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-sm font-medium text-gray-500 uppercase">Pending Actions</div>
          <div className="text-4xl font-bold text-amber-600 mt-2">0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Hires / Changes */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Personnel Changes</h2>
          <div className="space-y-4">
            {employees.slice(0, 5).map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {emp.staffName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{emp.staffName}</div>
                    <div className="text-xs text-gray-500">{emp.positionName}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-400">
                  {emp.employeeCode}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">HR Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition group">
              <span className="text-blue-600 font-bold">Add New Staff</span>
              <span className="text-xs text-blue-400 mt-1">Register new employee</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition group">
              <span className="text-purple-600 font-bold">Assign Roles</span>
              <span className="text-xs text-purple-400 mt-1">Update permissions</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-2xl border border-green-100 hover:bg-green-100 transition group">
              <span className="text-green-600 font-bold">View Reports</span>
              <span className="text-xs text-green-400 mt-1">Export personnel data</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-2xl border border-amber-100 hover:bg-amber-100 transition group">
              <span className="text-amber-600 font-bold">Policy Updates</span>
              <span className="text-xs text-amber-400 mt-1">Manage documents</span>
            </button>
          </div>
        </section>
      </div>

      {/* Appraisal Management Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Appraisal Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Form Templates</h3>
              <p className="text-sm text-gray-500 mb-4">Create and manage appraisal form templates, questions, and weights.</p>
            </div>
            <Link to="/appraisal-forms" className="text-blue-600 font-bold hover:underline self-start">Manage Forms &rarr;</Link>
          </div>
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Active Appraisals</h3>
              <p className="text-sm text-gray-500 mb-4">Monitor ongoing appraisal cycles and check completion statuses.</p>
            </div>
            <Link to="/appraisal-management" className="text-blue-600 font-bold hover:underline self-start">View Appraisals &rarr;</Link>
          </div>
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">360 Feedback</h3>
              <p className="text-sm text-gray-500 mb-4">Manage peer evaluation requests, configurations, and review aggregated results.</p>
            </div>
            <Link to="/hr/feedback" className="text-blue-600 font-bold hover:underline self-start">Manage Feedback &rarr;</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HRDashboard;