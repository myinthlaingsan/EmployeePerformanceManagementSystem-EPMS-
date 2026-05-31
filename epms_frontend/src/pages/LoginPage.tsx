import { useState, useEffect } from "react";
import { useLoginMutation } from "../features/auth/authApi";
import { useAppDispatch } from "../hooks/reduxHooks";
import { loginSuccess } from "../features/auth/authSlice";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "../assets/logo/Logo.jpg";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";

const LOCK_THRESHOLD = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const getAttemptsKey = (email?: string) => `login_attempts:${(email || 'global').toLowerCase()}`;

const loadAttempts = (email?: string) => {
  try {
    const raw = localStorage.getItem(getAttemptsKey(email));
    if (!raw) return { count: 0, lockedUntil: 0 };
    return JSON.parse(raw) as { count: number; lockedUntil: number };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
};

const saveAttempts = (email: string | undefined, data: { count: number; lockedUntil: number }) => {
  try {
    localStorage.setItem(getAttemptsKey(email), JSON.stringify(data));
  } catch {
    // ignore
  }
};

const clearAttempts = (email?: string) => {
  try {
    localStorage.removeItem(getAttemptsKey(email));
  } catch {
    // ignore
  }
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);

  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  // load attempts info for current email
  useEffect(() => {
    const info = loadAttempts(email);
    setAttempts(info.count);
    setLockedUntil(info.lockedUntil || 0);
  }, [email]);

  // unlock automatically when lock expires
  useEffect(() => {
    if (!lockedUntil) return;
    const t = setInterval(() => {
      if (lockedUntil <= Date.now()) {
        clearAttempts(email);
        setAttempts(0);
        setLockedUntil(0);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockedUntil, email]);

  const isLocked = lockedUntil > Date.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isLocked) {
      setError("Your account has been locked. Retry in 15 minutes later.");
      return;
    }

    try {
      const response = await login({ email, password }).unwrap();
      // reset attempts on success
      clearAttempts(email);
      setAttempts(0);
      setLockedUntil(0);

      dispatch(loginSuccess(response));
      navigate(from, { replace: true });
    } catch (err: any) {
      // increment attempts
      const newCount = attempts + 1;

      // if backend signalled locked (e.g., 423) or threshold reached, lock
      const status = err?.status || err?.data?.status;
      let newLockedUntil = 0;
      if (status === 423 || newCount >= LOCK_THRESHOLD) {
        newLockedUntil = Date.now() + LOCK_DURATION_MS;
        setError("Your account has been locked. Retry in 15 minutes later.");
      } else {
        setError("Invalid credentials. Please try again.");
      }

      setAttempts(newCount);
      setLockedUntil(newLockedUntil);
      saveAttempts(email, { count: newCount, lockedUntil: newLockedUntil });
    }
  };

  const inputCls = "block w-full pl-10 pr-4 py-2.5 text-[13px] font-[400] outline-none transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4" style={{ background: "#F5F6F8" }}>
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "10px", marginBottom: 14 }}>
            <img src={logo} alt="EPMS Logo" className="w-10 h-10 object-contain" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>EPMS Global</p>
          <p style={{ fontSize: 12, color: "#9EA3B0", marginTop: 2 }}>Employee Performance Management System</p>
        </div>

        {/* Card */}
        <div style={{ background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "24px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "#111827", marginBottom: 4 }}>Sign in</h2>
          <p style={{ fontSize: 13, color: "#9EA3B0", marginBottom: 20 }}>Welcome back! Please enter your details.</p>

          {error && (
            <div className="flex items-center gap-2 mb-4" style={{ background: "#FCEBEB", border: "0.5px solid #F5C2C2", borderRadius: 8, padding: "10px 12px" }}>
              <AlertCircle size={14} style={{ color: "#791F1F", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#791F1F" }}>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label htmlFor="email-address" style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
                Email address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA3B0" }} />
                <input
                  id="email-address" name="email" type="email" autoComplete="email" required
                  className={inputCls}
                  style={{ background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8, color: "#111827" }}
                  placeholder="name@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#9EA3B0", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9EA3B0" }} />
                <input
                  id="password" name="password" type="password" autoComplete="current-password" required
                  className={inputCls}
                  style={{ background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8, color: "#111827" }}
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit" disabled={isLoading || isLocked}
              className="w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{ background: isLocked ? "#9CA3AF" : "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 500, border: "none", marginTop: 4 }}
              onMouseEnter={(e) => { if (!isLoading && !isLocked) e.currentTarget.style.background = "#1648C0"; }}
              onMouseLeave={(e) => { if (!isLocked) e.currentTarget.style.background = "#1A56DB"; }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  Signing in…
                </>
              ) : (
                <><LogIn size={14} aria-hidden="true" /> {isLocked ? 'Locked' : 'Sign in'}</>
              )}
            </button>

            {/* Forgot password link moved here */}
            <div className="text-center">
              <Link to="/forgot-password" style={{ fontSize: 13, color: "#1A56DB" }}>Forgot password?</Link>
            </div>
          </form>
        </div>

        <p className="text-center mt-6" style={{ fontSize: 11, color: "#9EA3B0" }}>
          © {new Date().getFullYear()} EPMS Global · Secure access
        </p>
      </div>
    </div>
  );
};

export default LoginPage;