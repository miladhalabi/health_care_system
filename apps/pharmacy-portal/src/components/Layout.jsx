import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ToastContainer from './ToastContainer';

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'صرف الأدوية', path: '/dashboard', icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
    )},
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-[#fafaf9]" dir="rtl">
      <ToastContainer />
      {/* Modern Floating Sidebar */}
      <aside className="w-80 p-6 hidden lg:flex flex-col h-screen sticky top-0">
        <div className="bg-white rounded-[2.5rem] flex-1 flex flex-col shadow-xl shadow-stone-200/50 border border-white/50 relative overflow-hidden">
          {/* Brand */}
          <div className="p-10 pt-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-teal-700 rounded-2xl shadow-lg shadow-teal-500/20 text-white text-xl font-black mb-4">
              Rx
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">بوابة الصيدلية</h2>
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">نظام صرف الأدوية</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold ${
                  isActive(item.path) 
                    ? 'bg-primary text-white shadow-lg shadow-teal-500/20' 
                    : 'text-stone-500 hover:bg-stone-50 hover:text-primary'
                }`}
              >
                <span className={`${isActive(item.path) ? 'scale-110' : 'opacity-60'} transition-transform`}>
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
               <p className="text-[10px] font-bold text-stone-400 uppercase mt-1 tracking-widest">صيدلاني</p>
               <button onClick={handleLogout} className="btn btn-ghost btn-sm text-rose-500 mt-4 font-bold text-xs">خروج</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-teal-700 rounded-xl flex items-center justify-center text-white text-sm font-black">Rx</div>
            <span className="font-black text-stone-900">بوابة الصيدلية</span>
          </div>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm text-rose-500 font-bold text-xs">خروج</button>
        </header>

        <header className="h-28 hidden lg:flex items-center justify-between px-10 lg:px-14">
           <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{user?.pharmacy?.name || 'الصيدلية'}</p>
              <h1 className="text-3xl font-black text-stone-900 leading-tight">صرف الوصفات الطبية</h1>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="p-2 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center gap-3 pr-4 pl-2">
                 <span className="text-xs font-bold text-stone-500">متصل بالنظام</span>
                 <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></div>
                 </div>
              </div>
           </div>
        </header>

        <main className="px-6 lg:px-14 pb-14">
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
