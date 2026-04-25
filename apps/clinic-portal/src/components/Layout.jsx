import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ToastContainer from './ToastContainer';
import { Button, Badge, cn } from '@nhr/shared';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const Layout = ({ children }) => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [availableClinics, setAvailableClinics] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (user?.role === 'DOCTOR' && !activeSession) {
      fetchSessionData().then(() => {
        if (!isMounted) return;
      });
    }
    return () => { isMounted = false; };
  }, [user?.id]); // Only runs when user ID changes (Login/Logout)

  const fetchSessionData = async () => {
    try {
      const res = await api.get('/doctor/config');
      setActiveSession(res.data.activeClinic);
      
      // Update store with latest session data if it differs
      if (res.data.activeClinic?.id !== user.activeClinicId) {
        updateUser({ activeClinicId: res.data.activeClinic?.id });
      }
      
      // Extract unique clinics from rotation
      const clinics = Array.from(new Map(res.data.rotation.map(r => [r.clinic.id, r.clinic])).values());
      setAvailableClinics(clinics);

      // Auto-suggest logic: if no active session, suggest based on schedule
      if (!res.data.activeClinic && res.data.suggestedClinicId) {
        const suggested = clinics.find(c => c.id === res.data.suggestedClinicId);
        if (suggested && window.confirm(`يبدو أنك في ${suggested.name} الآن. هل تود تفعيل الجلسة؟`)) {
          handleSwitchSession(suggested.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchSession = async (clinicId) => {
    try {
      const res = await api.patch('/doctor/active-session', { clinicId });
      setActiveSession(res.data.activeClinic);
      
      // Persist the selection to the store/localstorage before reload
      updateUser({ activeClinicId: clinicId });
      
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'الرئيسية', path: '/dashboard', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'جدول المواعيد', path: '/schedule', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'سجل المرضى', path: '/search', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'جدول المناوبات', path: '/rotation', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/><path d="M12 7v8"/></svg>
    ), roles: ['DOCTOR'] },
    { label: 'طابور الانتظار', path: '/queue', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
    ), roles: ['RECEPTIONIST'] },
    { label: 'المعاينات', path: '/encounters', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    ), roles: ['DOCTOR'] },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-stone-50" dir="rtl">
      <ToastContainer />
      
      {/* Modern Floating Sidebar */}
      <aside className="w-80 p-6 hidden lg:flex flex-col h-screen sticky top-0">
        <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col shadow-xl shadow-stone-200/50 border border-white/50 relative overflow-hidden">
          {/* Brand */}
          <div className="p-10 pt-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl shadow-lg shadow-teal-500/20 text-white text-2xl font-black mb-4">
              N
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">نظام السجل الوطني</h2>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">بوابة العيادة والمركز الطبي</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.filter(item => item.roles.includes(user?.role)).map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={cn(
                  "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold",
                  isActive(item.path) 
                    ? 'bg-primary text-white shadow-lg shadow-teal-500/20' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-primary'
                )}
              >
                <span className={cn(isActive(item.path) ? 'scale-110' : 'opacity-60', "transition-transform")}>
                  {item.icon}
                </span>
                <span className="text-lg">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-8">
            <div className="bg-stone-50 rounded-[2rem] p-6 text-center border border-stone-100">
               <div className="avatar mb-3">
                 <div className="w-16 rounded-2xl ring ring-white ring-offset-2">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.fullName}`} alt="avatar" />
                 </div>
               </div>
               <p className="text-sm font-black text-stone-900 truncate">{user?.fullName}</p>
               <p className="text-[10px] font-bold text-stone-400 uppercase mt-1 tracking-widest">
                 {user?.role === 'DOCTOR' ? 'طبيب متخصص' : 'موظف استقبال'}
               </p>
               <Button onClick={handleLogout} variant="ghost" className="h-8 mt-4 text-rose-500 text-xs">خروج</Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-28 flex items-center justify-between px-10 lg:px-14">
           <div className="flex items-center gap-8">
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{user?.clinic?.name || 'مركز العناية الطبية'}</p>
                <h1 className="text-3xl font-black text-stone-900 leading-tight">
                  {navItems.find(i => i.path === location.pathname)?.label || 'إدارة النظام'}
                </h1>
              </div>

              {user?.role === 'DOCTOR' && (
                <div className="h-12 w-px bg-stone-200 hidden md:block"></div>
              )}

              {user?.role === 'DOCTOR' && (
                <div className="hidden md:flex flex-col">
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">المقر الحالي</p>
                   <select 
                     className="select select-sm bg-white border-stone-200 rounded-xl font-bold text-xs"
                     value={activeSession?.id || ''}
                     onChange={(e) => handleSwitchSession(e.target.value)}
                   >
                     <option value="">غير متصل بالخدمة</option>
                     {availableClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
              )}
           </div>
           
           <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 pr-4 pl-2">
                 <span className="text-xs font-bold text-stone-500">الحالة المباشرة</span>
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                 </div>
              </div>
           </div>
        </header>

        <main className="px-10 lg:px-14 pb-14">
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
