import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSetPasswordMutation } from "../features/employee/employeeapi";

const SetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [setPassword] = useSetPasswordMutation();

  const [passwordData, setPasswordData] = useState({
    password: "",
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: "Invalid or missing token." });
      return;
    }
    try {
      await setPassword({ token, body: { password: passwordData.password } }).unwrap();
      setMessage({ type: 'success', text: "Password set successfully! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to set password. The link may have expired." });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            EPMS
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Setup Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please choose a strong password to activate your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl sm:px-10 border border-gray-100">
          {message && (
            <div className={`mb-6 p-4 rounded-2xl text-sm font-bold ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                New Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-blue-200"
              >
                Activate Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Fix the typo in onChange above
const setFormData = (data: any) => {}; // Placeholder for my thought, real code uses setPasswordData
export default SetPasswordPage;