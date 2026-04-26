import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils/index.js';

/**
 * A unified, professional layout for all national health portals.
 * Features a glassmorphism sidebar, a clean header, and responsive design.
 */
export const PortalLayout = ({ 
  children, 
  user, 
  navItems = [], 
  onLogout, 
  brandName = "نظام السجل الوطني",
  portalName = "بوابة الإدارة",
  headerActions,
  logo = "N"
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-surface-200 font-cairo" dir="rtl">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-72 bg-white/80 backdrop-blur-xl border-l border-slate-200/50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Brand Logo */}
          <div className="p-8 pb-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-xl font-black shadow-card">
              {logo}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">{brandName}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{portalName}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all duration-200 group",
                  isActive(item.path) 
                    ? "bg-primary/10 text-primary font-bold shadow-soft" 
                    : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-900"
                )}
              >
                <span className={cn(
                  "transition-transform duration-200",
                  isActive(item.path) ? "scale-110 text-primary" : "opacity-70 group-hover:opacity-100"
                )}>
                  {item.icon}
                </span>
                <span className="text-[15px]">{item.label}</span>
                {isActive(item.path) && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-6 mt-auto">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-soft">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`} alt="avatar" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {user?.role === 'DOCTOR' ? 'طبيب متخصص' : user?.role === 'RECEPTIONIST' ? 'موظف استقبال' : 'صيدلاني'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full py-2.5 rounded-lg text-[11px] font-black text-rose-500 hover:bg-rose-50 transition-colors uppercase tracking-widest border border-rose-100"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-10 bg-white/50 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/50">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 -mr-2 lg:hidden text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            
            <div className="flex flex-col">
               <h1 className="text-xl lg:text-2xl font-black text-slate-900 leading-none">
                 {navItems.find(i => i.path === location.pathname)?.label || "لوحة التحكم"}
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {headerActions}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">النظام متصل</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-10">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
