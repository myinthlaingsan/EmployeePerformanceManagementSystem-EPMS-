import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useResetPasswordMutation } from "../features/auth/authApi";
import { 
  RotateCcw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setMessage({ type: 'error', text: "Invalid or missing token." });
      return;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }

    try {
      await resetPassword({ token, newPassword: passwordData.password }).unwrap();
      setMessage({ type: 'success', text: "Password reset successfully! Redirecting to login..." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.data?.message || "Failed to reset password. The link may have expired." });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-[420px] w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-slate-100 flex flex-col items-center">
            {/* Reset Icon */}
            <div className="mb-6 p-3.5 bg-indigo-50 rounded-full text-indigo-600">
              <RotateCcw className="w-7 h-7" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">Reset Password</h1>
            <p className="text-slate-500 text-sm text-center mt-2.5 mb-8 leading-relaxed px-2">
              Please enter a secure password for your EPMS Global account.
            </p>

            {message && (
              <div className={`w-full mb-6 p-3.5 rounded-2xl text-sm flex items-center gap-3 animate-shake ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-100' 
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="font-medium">{message.text}</span>
              </div>
            )}

            <form className="w-full space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 pr-12"
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 pr-12"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="w-full py-10 flex flex-col items-center gap-3 border-t border-slate-100 bg-white/30">
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Enterprise-grade security by EPMS Global</span>
        </div>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} EPMS Global. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ResetPasswordPage;


