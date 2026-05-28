import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  MessageSquare,
  TrendingUp,
  BarChart3,
  ChevronDown,
  Plus,
  LogOut,
  Building2,
  ShieldCheck,
  Briefcase,
  Zap,
  Target,
  History,
  Calendar,
  Layers,
  X,
  Repeat2,
} from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  hrOnly?: boolean;
  end?: boolean;
  privilegedOnly?: boolean;
  hideForPrivileged?: boolean;
  hideForAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Appraisals", to: "/appraisal", icon: ClipboardCheck, end: true },
  { label: "Performance Pulse", to: "/performance-history/admin", icon: History, adminOnly: true },
  { label: "Team Pulse", to: "/performance-history/manager", icon: History, privilegedOnly: true, hideForAdmin: true },
  { label: "Continuous Feedback", to: "/continuous-feedback", icon: MessageSquare, hideForPrivileged: true, hideForAdmin: true },
  { label: "1-on-1 Meetings", to: "/meetings", icon: Users, hideForPrivileged: true, hideForAdmin: true },
  { label: "PIP", to: "/pip", icon: TrendingUp, end: true },
  { label: "Analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: "Employees", to: "/employees", icon: Users },
  { label: "Departments", to: "/departments", icon: Building2 },
  { label: "Job Levels", to: "/job-levels", icon: Zap },
  { label: "Positions", to: "/positions", icon: Briefcase },
  { label: "Teams", to: "/teams", icon: Users },
  { label: "Financial Years", to: "/financial-years", icon: Calendar },
  { label: "Performance Categories", to: "/performance-categories", icon: Layers },
  { label: "Strategic Analytics", to: "/analytics", icon: TrendingUp },
  { label: "Roles", to: "/roles", icon: ShieldCheck, adminOnly: true },
  { label: "Permissions", to: "/permissions", icon: ShieldCheck, adminOnly: true, end: true },
  { label: "Permissions Matrix", to: "/permissions/matrix", icon: ShieldCheck, adminOnly: true },
  { label: "Assign Permissions", to: "/permissions/assign", icon: Zap, adminOnly: true },
];

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const navCls = (active: boolean) =>
  [
    "flex items-center gap-[9px] w-full text-[13px] rounded-[8px] transition-colors",
    active
      ? "bg-[#EEF3FD] text-[#1A56DB] font-medium"
      : "text-[#5A6070] font-normal hover:bg-[#F0F2F8] hover:text-[#111827]",
  ].join(" ");

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const { logout, isAdmin, isHR, isManager, user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mgmtOpen, setMgmtOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);
  const [feedback360Open, setFeedback360Open] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) => {
    switch (item.label) {
      case "Performance Pulse":   return hasPermission("REPORT_VIEW_ALL");
      case "Team Pulse":          return hasPermission("APPRAISAL_VIEW_TEAM") && !isAdmin && !isHR;
      case "Continuous Feedback": return hasPermission("CONTINUOUS_FEEDBACK");
      case "1-on-1 Meetings":     return hasPermission("MEETING_MANAGE");
      case "PIP":                 return hasPermission("PIP_VIEW_OWN") || hasPermission("PIP_CREATE");
      case "Analytics":           return hasPermission("REPORT_VIEW_ALL");
      default:                    return true;
    }
  });

  const avatarColor =
    AVATAR_COLORS[(user?.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  const perfSubItems: Array<{ to: string; label: string; end?: boolean }> = [
    { to: "/kpi", label: "KPI Intelligence Hub", end: true },
    ...(hasPermission("KPI_VIEW_OWN") ? [{ to: "/kpi/my", label: "My Goals" }] : []),
    ...(hasPermission("KPI_VIEW_OWN") && user ? [{ to: `/kpi/history/${user.id}`, label: "My KPI Journey" }] : []),
    ...(hasPermission("KPI_VIEW_TEAM") ? [{ to: "/kpi/team", label: "Team Performance" }] : []),
    ...(isHR || isAdmin
      ? [{ to: "/kpi/org-history", label: "Org KPI History" }]
      : []),
    ...(isManager && !isHR && !isAdmin
      ? [{ to: "/kpi/org-history", label: "Team KPI History" }]
      : []),
    ...(hasPermission("KPI_LIBRARY_MANAGE")
      ? [
          { to: "/kpi/manage", label: "Goal Management" },
          { to: "/kpi/library", label: "KPI Library" },
          { to: "/kpi/categories", label: "KPI Categories" },
        ]
      : []),
  ];

  const handleNavClick = () => {
    onClose?.();
  };

  return (
    <aside
      className="flex flex-col h-screen bg-white shrink-0"
      style={{ width: 200, borderRight: "0.5px solid #E4E6EC" }}
    >
      {/* Brand */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "20px 18px", borderBottom: "0.5px solid #E4E6EC" }}
      >
        <div className="flex items-center gap-[9px]">
          <div
            className="flex items-center justify-center text-white shrink-0"
            style={{ width: 28, height: 28, background: "#1A56DB", borderRadius: 7 }}
          >
            <BarChart3 size={14} aria-hidden="true" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>EPMS</span>
        </div>
        {/* Close button — mobile only */}
        <button
          className="md:hidden flex items-center justify-center rounded-[8px] transition-colors hover:bg-[#F0F2F8]"
          style={{ width: 28, height: 28, color: "#5A6070" }}
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: "20px 10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Main nav items */}
          {filteredNav.map((item) => {
            const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.label}
                to={item.to}
                style={{ padding: "8px 10px" }}
                className={navCls(isActive)}
                onClick={handleNavClick}
              >
                <item.icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}

          {/* 360 Feedback accordion */}
          <div>
            <button
              onClick={() => setFeedback360Open(!feedback360Open)}
              style={{ padding: "8px 10px" }}
              className="w-full flex items-center justify-between rounded-[8px] text-[13px] font-normal text-[#5A6070] hover:bg-[#F0F2F8] hover:text-[#111827] transition-colors"
            >
              <span className="flex items-center gap-[9px]">
                <Repeat2 size={16} aria-hidden="true" />
                360° Feedback
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${feedback360Open ? "rotate-180" : ""}`}
              />
            </button>

            {feedback360Open && (
              <div style={{ paddingLeft: 8, marginTop: 1 }}>
                {hasPermission("FEEDBACK360_PARTICIPATE") && (
                  <NavLink
                    to="/360-feedback/pending"
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    My Pending
                  </NavLink>
                )}
                {hasPermission("FEEDBACK360_VIEW_REPORT") && (
                  <NavLink
                    to="/360-feedback/my-report"
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    My Report
                  </NavLink>
                )}
                {hasPermission("FEEDBACK360_NOMINATE") && (
                  <NavLink
                    to="/360-feedback/nominations"
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    Nominations
                  </NavLink>
                )}
                {hasPermission("FEEDBACK360_MANAGE") && (
                  <NavLink
                    to="/360-feedback/admin"
                    end
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    Admin Panel
                  </NavLink>
                )}
                {hasPermission("FEEDBACK360_MANAGE") && (
                  <NavLink
                    to="/360-feedback/admin/competencies"
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    Competencies
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Performance Hub accordion */}
          <div>
            <button
              onClick={() => setPerfOpen(!perfOpen)}
              style={{ padding: "8px 10px" }}
              className="w-full flex items-center justify-between rounded-[8px] text-[13px] font-normal text-[#5A6070] hover:bg-[#F0F2F8] hover:text-[#111827] transition-colors"
            >
              <span className="flex items-center gap-[9px]">
                <Target size={16} aria-hidden="true" />
                KPIs Hub
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${perfOpen ? "rotate-180" : ""}`}
              />
            </button>

            {perfOpen && (
              <div style={{ paddingLeft: 8, marginTop: 1 }}>
                {perfSubItems.map((sub) => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    end={sub.end}
                    style={{ padding: "7px 10px" }}
                    className={({ isActive }) => navCls(isActive)}
                    onClick={handleNavClick}
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Management accordion */}
          {(isAdmin || isHR) && (
            <div>
              <button
                onClick={() => setMgmtOpen(!mgmtOpen)}
                style={{ padding: "8px 10px" }}
                className="w-full flex items-center justify-between rounded-[8px] text-[13px] font-normal text-[#5A6070] hover:bg-[#F0F2F8] hover:text-[#111827] transition-colors"
              >
                <span className="flex items-center gap-[9px]">
                  <Building2 size={16} aria-hidden="true" />
                  Management
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${mgmtOpen ? "rotate-180" : ""}`}
                />
              </button>

              {mgmtOpen && (
                <div style={{ paddingLeft: 8, marginTop: 1 }}>
                  {ADMIN_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.end}
                      style={{ padding: "7px 10px" }}
                      className={({ isActive }) => navCls(isActive)}
                      onClick={handleNavClick}
                    >
                      <item.icon size={16} aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Primary action button */}
      <div style={{ padding: "0 10px 10px" }}>
        <button
          onClick={() => { navigate("/appraisal/new"); handleNavClick(); }}
          className="w-full flex items-center justify-center gap-[9px] text-white text-[13px] font-medium transition-colors"
          style={{ background: "#1A56DB", borderRadius: 8, padding: "8px 14px", border: "none" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}
        >
          <Plus size={14} aria-hidden="true" />
          New Review
        </button>
      </div>

      {/* User profile row */}
      <div
        className="flex items-center gap-[10px] cursor-pointer hover:bg-[#F0F2F8] transition-colors"
        style={{ borderTop: "0.5px solid #E4E6EC", padding: "12px 14px" }}
        onClick={() => { navigate("/profile"); handleNavClick(); }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: avatarColor.bg,
            color: avatarColor.text,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {user?.staffName?.charAt(0) ?? "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate" style={{ fontSize: 13, fontWeight: 500, color: "#111827", lineHeight: 1.2 }}>
            {user?.staffName ?? "User"}
          </p>
          <p className="truncate" style={{ fontSize: 11, color: "#9EA3B0", lineHeight: 1.2, marginTop: 2 }}>
            {user?.positionName ?? ""}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); logout(); }}
          className="shrink-0 hover:text-[#5A6070] transition-colors"
          style={{ color: "#9EA3B0" }}
          aria-label="Log out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
