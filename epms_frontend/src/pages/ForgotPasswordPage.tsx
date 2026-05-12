import { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../features/auth/authApi";
import logo from "../assets/logo/Logo.jpg";
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await forgotPassword({ email }).unwrap();
      setMessage({ type: 'success', text: "Password reset link sent to your email!" });
      setEmail("");
    } catch (err: any) {
      setMessage({ type: 'error', text: err.data?.message || "Failed to send reset link. Please try again." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col items-center mb-10 animate-fade-in">
        <div className="mb-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          <img
            src={logo}
            alt="EPMS Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          EPMS Global
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Employee Performance Management System
        </p>
      </div>

      {/* Card Section */}
      <div className="max-w-md w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 relative overflow-hidden">
          {/* Top accent bar */}
          {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div> */}

          <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Forgot Password
          </h2>
          <p className="text-slate-500 text-[0.9375rem] leading-relaxed mb-10">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {message && (
            <div className={`mb-8 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Work Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-12 text-center space-y-6">
          <p className="text-slate-500 text-sm leading-relaxed">
            Having trouble? Contact your organization's IT administrator or <br />
            visit our <a href="#" className="text-blue-600 font-bold hover:underline">Help Center</a>.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} EPMS Global
            </span>
            <span className="text-slate-200">•</span>
            <a href="#" className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">Privacy Policy</a>
            <span className="text-slate-200">•</span>
            <a href="#" className="text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

