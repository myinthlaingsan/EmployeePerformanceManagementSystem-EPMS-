import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { 
  Search, 
  HelpCircle, 
  Settings 
} from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Performance Orchestrator",
  "/appraisal": "Appraisals",
  "/profile": "My Profile",
  "/notifications": "Notifications",
  "/hr": "HR Dashboard",
  "/employees": "Employee Management",
  "/departments": "Departments",
  "/roles": "Roles",
  "/job-levels": "Job Levels",
  "/positions": "Positions",
  "/permissions": "Permissions",
  "/pip": "Performance Improvement Plans",
};

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const title = PAGE_TITLES[pathname] || "EPMS";

  return (
    <header className="h-20 bg-white border-b border-surface-border flex items-center justify-between px-10 sticky top-0 z-30">
      {/* Title */}
      <h2 className="text-xl font-black text-brand-primary tracking-tight uppercase tracking-[0.1em]">{title}</h2>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-12">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search performance records..."
            className="w-full bg-surface-base border border-surface-border rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-text-muted/50 font-medium"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        
        <button 
          className="p-2.5 text-text-muted hover:bg-surface-base hover:text-brand-primary rounded-xl transition-all"
          title="Help"
        >
          <HelpCircle className="w-5 h-5" strokeWidth={2} />
        </button>

        <button 
          className="p-2.5 text-text-muted hover:bg-surface-base hover:text-brand-primary rounded-xl transition-all"
          title="Settings"
          onClick={() => navigate("/profile")}
        >
          <Settings className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* User Profile */}
        <button 
          onClick={() => navigate("/profile")}
          className="ml-4 flex items-center gap-3 p-1.5 pl-4 hover:bg-surface-base rounded-2xl transition-all border border-transparent hover:border-surface-border"
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-brand-primary leading-none">{user?.staffName}</p>
            <p className="text-[10px] text-text-muted mt-1.5 font-bold uppercase tracking-widest">{user?.positionName}</p>
          </div>
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-brand-primary/20">
            {user?.staffName?.charAt(0) || "U"}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
