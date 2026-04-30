import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";

const Navbar = () => {
  const { user, logout, isAdmin, isHR } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EPMS
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className="text-gray-500 hover:text-blue-600 px-1 pt-1 text-sm font-medium transition"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="text-gray-500 hover:text-blue-600 px-1 pt-1 text-sm font-medium transition"
              >
                Profile
              </Link>
              <Link
                to="/pip"
                className="text-gray-500 hover:text-blue-600 px-1 pt-1 text-sm font-medium transition"
              >
                PIP
              </Link>
              {(isAdmin || isHR) && (
                <>
                  <Link
                    to="/hr"
                    className="text-gray-500 hover:text-blue-600 px-1 pt-1 text-sm font-medium transition"
                  >
                    HR Panel
                  </Link>
                  
                  {/* Management Dropdown */}
                  <div className="relative flex items-center">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="text-gray-500 hover:text-blue-600 px-1 pt-1 text-sm font-medium transition flex items-center gap-1"
                    >
                      Management
                      <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-16 left-0 w-48 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-50">
                        <Link to="/employees" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Employees</Link>
                        <Link to="/departments" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Departments</Link>
                        <Link to="/roles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Roles</Link>
                        <Link to="/job-levels" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Job Levels</Link>
                        <Link to="/positions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Positions</Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link to="/permissions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsDropdownOpen(false)}>Permissions</Link>
                        <Link to="/permissions/matrix" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-bold text-blue-600" onClick={() => setIsDropdownOpen(false)}>Access Matrix</Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900">{user?.staffName}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{user?.positionName}</p>
            </div>
            
            <NotificationBell />

            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition shadow-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
