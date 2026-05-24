import { useLocation, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { Search, HelpCircle, Settings, ChevronRight, Menu } from "lucide-react";

interface PageInfo {
  section?: string;
  title: string;
}

const PAGE_MAP: Record<string, PageInfo> = {
  "/dashboard":            { title: "Dashboard" },
  "/appraisal":            { section: "Appraisals", title: "Appraisal list" },
  "/appraisal/360":        { section: "Appraisals", title: "360 Feedback" },
  "/profile":              { title: "My profile" },
  "/notifications":        { title: "Notifications" },
  "/employees":            { section: "Management", title: "Employees" },
  "/departments":          { section: "Management", title: "Departments" },
  "/roles":                { section: "Management", title: "Roles" },
  "/job-levels":           { section: "Management", title: "Job levels" },
  "/positions":            { section: "Management", title: "Positions" },
  "/teams":                { section: "Management", title: "Teams" },
  "/permissions":          { section: "Management", title: "Permissions" },
  "/permissions/matrix":   { section: "Management", title: "Permissions matrix" },
  "/permissions/assign":   { section: "Management", title: "Assign permissions" },
  "/financial-years":      { section: "Management", title: "Financial years" },
  "/performance-categories": { section: "Management", title: "Performance categories" },
  "/pip":                  { title: "Performance improvement plans" },
  "/analytics":            { title: "Analytics" },
  "/kpi":                  { section: "Performance Hub", title: "KPI hub" },
  "/kpi/my":               { section: "Performance Hub", title: "My goals" },
  "/kpi/team":             { section: "Performance Hub", title: "Team performance" },
  "/kpi/manage":           { section: "Performance Hub", title: "Goal management" },
  "/kpi/library":          { section: "Performance Hub", title: "KPI library" },
  "/kpi/categories":       { section: "Performance Hub", title: "KPI categories" },
  "/meetings":             { title: "1-on-1 meetings" },
  "/continuous-feedback":  { title: "Continuous feedback" },
  "/performance-history":  { title: "Performance pulse" },
};

function resolvePageInfo(pathname: string): PageInfo {
  if (PAGE_MAP[pathname]) return PAGE_MAP[pathname];
  const prefix = Object.keys(PAGE_MAP)
    .filter((k) => pathname.startsWith(k) && k !== "/")
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? PAGE_MAP[prefix] : { title: "EPMS" };
}

const iconBtnBase: React.CSSProperties = {
  width: 32,
  height: 32,
  background: "#F5F6F8",
  border: "0.5px solid #E0E2E8",
  borderRadius: 8,
  color: "#5A6070",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s, border-color 0.15s",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pageInfo = resolvePageInfo(pathname);

  const handleIconEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#EEF3FD";
    e.currentTarget.style.color = "#1A56DB";
    e.currentTarget.style.borderColor = "#B5D4F4";
  };
  const handleIconLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = "#F5F6F8";
    e.currentTarget.style.color = "#5A6070";
    e.currentTarget.style.borderColor = "#E0E2E8";
  };

  return (
    <header
      className="flex items-center justify-between bg-white sticky top-0 z-30 shrink-0"
      style={{ height: 52, borderBottom: "0.5px solid #E4E6EC", padding: "0 16px" }}
    >
      <div className="flex items-center gap-2">
        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex items-center justify-center rounded-lg transition-colors hover:bg-[#F0F2F8]"
          style={{ width: 32, height: 32, color: "#5A6070" }}
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1" aria-label="Breadcrumb">
          {pageInfo.section ? (
            <>
              <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 400, color: "#9EA3B0" }}>
                {pageInfo.section}
              </span>
              <ChevronRight size={12} className="hidden sm:block" style={{ color: "#9EA3B0" }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
                {pageInfo.title}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
              {pageInfo.title}
            </span>
          )}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search — hidden on very small screens */}
        <div className="relative hidden sm:flex items-center">
          <Search
            size={14}
            className="absolute left-3 pointer-events-none"
            style={{ color: "#9EA3B0" }}
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search..."
            style={{
              background: "#F5F6F8",
              border: "0.5px solid #E0E2E8",
              borderRadius: 8,
              padding: "6px 12px 6px 32px",
              width: 160,
              fontSize: 13,
              color: "#9EA3B0",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Notification bell */}
        <NotificationBell />

        {/* Help — hidden on mobile */}
        <button
          className="hidden md:flex"
          style={iconBtnBase}
          title="Help"
          aria-label="Help"
          onMouseEnter={handleIconEnter}
          onMouseLeave={handleIconLeave}
        >
          <HelpCircle size={16} aria-hidden="true" />
        </button>

        {/* Settings */}
        <button
          style={iconBtnBase}
          title="Settings"
          aria-label="Settings"
          onClick={() => navigate("/profile")}
          onMouseEnter={handleIconEnter}
          onMouseLeave={handleIconLeave}
        >
          <Settings size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default Header;
