import { useAuth } from "../hooks/useAuth";
import { logout } from "../features/auth/authSlice";
import { useAppDispatch } from "../hooks/reduxHooks";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isAdmin, isHR, isManager, isSenior } = useAuth();
  const navigate = useNavigate();
  if (!user) return <div>Loading...</div>;
  return (
    
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.staffName}</h1>
        <p className="text-gray-600">
          {user.positionName} | {user.levelName} (Rank: {user.levelRank})
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Common Section: Profile Summary */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">My Profile</h2>
            <div className="space-y-2">
              <p><strong>Code:</strong> {user.employeeCode}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
            </div>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => navigate("/profile")}
              className="w-full bg-blue-50 text-blue-700 px-4 py-2.5 rounded-lg hover:bg-blue-100 transition font-medium border border-blue-100"
            >
              Update Employee Information
            </button>
          </div>
        </section>

        {/* HR/Admin Section: Management Summary */}
        {(isAdmin || isHR) && (
          <section className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Organization Overview</h2>
            <p className="mb-4">Access administrative tools and manage departments.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Manage Employees
            </button>
          </section>
        )}

        {/* Senior Level Section (L01-L04): Strategy/Reports */}
        {isSenior && (
          <section className="bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-100">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">Strategic Insights</h2>
            <p className="mb-4">You have access to high-level organizational reports.</p>
            <div className="flex gap-2">
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                View Reports
              </button>
            </div>
          </section>
        )}

        {/* Manager Section */}
        {isManager && (
          <section className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-100">
            <h2 className="text-xl font-semibold mb-4 text-green-800">Team Management</h2>
            <p className="mb-4">Review KPIs and performance of your direct reports.</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Review Team
            </button>
          </section>
        )}
      </div>

      {/* Task List (Visible to all, but content could be different) */}
      <section className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
        <div className="border-t pt-4">
          <p className="text-gray-500 italic">No pending tasks for today.</p>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
