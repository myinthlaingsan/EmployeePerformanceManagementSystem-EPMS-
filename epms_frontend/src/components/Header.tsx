import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NotificationBell } from "./NotificationBell";
import { 
  HiOutlineSearch, 
  HiOutlineQuestionMarkCircle, 
  HiOutlineCog 
} from "react-icons/hi";

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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-30">
      {/* Title */}
      <h2 className="text-lg font-bold text-blue-600 tracking-tight">{title}</h2>

      {/* Search Bar */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative group">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search performance records..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        
        <button 
          className="p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
          title="Help"
        >
          <HiOutlineQuestionMarkCircle className="w-6 h-6" />
        </button>

        <button 
          className="p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all"
          title="Settings"
          onClick={() => navigate("/profile")}
        >
          <HiOutlineCog className="w-6 h-6" />
        </button>

        {/* User Profile */}
        <button 
          onClick={() => navigate("/profile")}
          className="ml-2 flex items-center gap-3 p-1 pl-3 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-100"
        >
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{user?.staffName}</p>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tighter">{user?.positionName}</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.staffName?.charAt(0) || "U"}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
