import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isPipPage = location.pathname.startsWith('/pip');

    const navItems = [
        { label: 'PIPS OVERVIEW', path: '/pip', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        { label: 'ACTIVE PLANS', path: '/pip/active', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { label: 'MILESTONES', path: '/pip/milestones', icon: 'M3 21v-4m18 4v-4M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
        { label: 'FEEDBACK LOGS', path: '/pip/feedback', icon: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { label: 'SETTINGS', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z' },
    ];

    return (
        <div className="flex h-screen bg-surface-base font-sans antialiased text-text-body overflow-hidden">
            {/* Professional Sidebar */}
            <aside className="w-72 bg-white border-r border-surface-border flex flex-col shadow-sm z-20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 bg-[#0f172a] rounded-lg flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
                        </div>
                        <span className="font-black text-xl tracking-tighter text-[#0f172a]">PIP Manager</span>
                    </div>
                    <p className="text-[9px] font-bold text-text-muted tracking-[0.3em] uppercase ml-11">Precision Performance</p>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-5 py-3.5 rounded-xl text-[11px] font-bold tracking-widest transition-all duration-300 ${
                                    isActive
                                        ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
                                        : 'text-text-muted hover:bg-surface-base hover:text-text-title'
                                }`
                            }
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-surface-border space-y-4">
                    <button 
                        onClick={() => navigate('/pip/new')}
                        className="w-full bg-brand-primary text-white py-3.5 rounded-xl text-xs font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">+</span> Launch New PIP
                    </button>
                    
                    <button className="w-full flex items-center gap-3 px-5 py-3 text-text-muted hover:text-text-title transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[11px] font-bold tracking-widest uppercase">Help Center</span>
                    </button>
                </div>
            </aside>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto">
                    <div className={`${isPipPage ? 'p-10 lg:p-14' : 'max-w-7xl mx-auto p-10 lg:p-14'}`}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
