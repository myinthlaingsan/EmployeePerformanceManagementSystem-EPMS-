import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  User, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  BarChart3,
  ChevronDown,
  Plus,
  LifeBuoy,
  LogOut,
  Building2,
  ShieldCheck,
  Briefcase,
  Zap,
  Target,
  Library
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  hrOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Appraisals", to: "/appraisal", icon: ClipboardCheck },
  { label: "Self-Assessment", to: "/appraisal/self", icon: User },
  { label: "360 Feedback", to: "/appraisal/360", icon: Users },
  { label: "1-on-1s", to: "/appraisal/1-on-1", icon: MessageSquare },
  { label: "PIP", to: "/pip", icon: TrendingUp },
  { label: "Performance Hub", to: "/kpi", icon: Target },
  { label: "Analytics", to: "/hr", icon: BarChart3, adminOnly: true },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Employees", to: "/employees", icon: Users },
  { label: "Departments", to: "/departments", icon: Building2 },
  { label: "Roles", to: "/roles", icon: ShieldCheck },
  { label: "Job Levels", to: "/job-levels", icon: Zap },
  { label: "Positions", to: "/positions", icon: Briefcase },
  { label: "Teams", to: "/teams", icon: Users },
  { label: "KPI Library", to: "/kpi/library", icon: Library },
  { label: "Permissions", to: "/permissions", icon: ShieldCheck },
  { label: "Permissions Matrix", to: "/permissions/matrix", icon: ShieldCheck },
];

const Sidebar = () => {
  const { logout, isAdmin, isHR } = useAuth();
  const navigate = useNavigate();
  const [mgmtOpen, setMgmtOpen] = useState(false);

  const activeClass = "bg-blue-50 text-blue-600 border-r-4 border-blue-600";
  const inactiveClass = "text-gray-500 hover:bg-gray-50 hover:text-gray-900";

  const filteredNav = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin && !isHR) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">HR Portal</h1>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">Enterprise Suite</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                  isActive ? activeClass : inactiveClass
                }`
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}

          {/* Management Accordion */}
          {(isAdmin || isHR) && (
            <div>
              <button
                onClick={() => setMgmtOpen(!mgmtOpen)}
                className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5" strokeWidth={2} />
                  Management
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${mgmtOpen ? "rotate-180" : ""}`} />
              </button>
              {mgmtOpen && (
                <div className="bg-gray-50/50 py-1">
                  {ADMIN_ITEMS.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-12 pr-6 py-2.5 text-xs font-medium transition-all ${
                          isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" strokeWidth={2} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* CTA Button */}
      <div className="p-6">
        <button
          onClick={() => navigate("/appraisal/new")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          New Review
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all">
          <LifeBuoy className="w-5 h-5" strokeWidth={2} />
          Support
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" strokeWidth={2} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
