import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

const Navbar = () => {
  const { user, logout, isAdmin, isHR } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Team', path: '/team' },
    { name: 'Directory', path: '/directory' },
  ];

  return (
    <nav className="bg-white border-b border-surface-border sticky top-0 z-[60] h-16 shrink-0">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-primary tracking-tighter">EPMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors
                  ${location.pathname === link.path ? 'text-brand-primary' : 'text-text-muted hover:text-text-title'}`}
              >
                {link.name}
              </Link>
            ))}
            
            {(isAdmin || isHR) && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-text-muted hover:text-text-title text-sm font-medium transition-colors flex items-center gap-1"
                >
                  Management
                  <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute top-10 left-0 w-56 bg-white border border-surface-border shadow-premium rounded-2xl py-3 z-20 animate-in fade-in zoom-in duration-150">
                      <Link to="/employees" className="block px-5 py-2.5 text-sm text-text-body hover:bg-surface-base" onClick={() => setIsDropdownOpen(false)}>Employees</Link>
                      <Link to="/departments" className="block px-5 py-2.5 text-sm text-text-body hover:bg-surface-base" onClick={() => setIsDropdownOpen(false)}>Departments</Link>
                      <Link to="/roles" className="block px-5 py-2.5 text-sm text-text-body hover:bg-surface-base" onClick={() => setIsDropdownOpen(false)}>Roles</Link>
                      <div className="border-t border-surface-border my-2"></div>
                      <Link to="/permissions/matrix" className="block px-5 py-2.5 text-sm font-bold text-brand-primary hover:bg-brand-primary/5" onClick={() => setIsDropdownOpen(false)}>Access Matrix</Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-text-muted">
             <button className="hover:text-text-title transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
             </button>
             <button className="hover:text-text-title transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </button>
          </div>

          <div className="h-8 w-[1px] bg-surface-border"></div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-text-title leading-none mb-1">{user?.staffName}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-widest font-medium leading-none">{user?.positionName}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-primary/20">
              {user?.staffName?.charAt(0)}
            </div>
            <button
              onClick={logout}
              className="ml-2 p-2 text-text-muted hover:text-red-600 transition"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

