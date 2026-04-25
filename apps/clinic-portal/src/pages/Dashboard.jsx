import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6" dir="rtl">
      <div className="card max-w-md bg-white p-12 shadow-xl text-center border border-stone-200">
         <div className="text-6xl mb-6">🚫</div>
         <h1 className="text-2xl font-black text-stone-900 mb-4">عذراً، {user?.fullName}</h1>
         <p className="text-stone-500 font-bold leading-relaxed mb-8">
            أنت مسجل في النظام بصفة "مواطن/مريض". لا يمكنك الوصول إلى بوابة العيادة المخصصة للأطباء.
         </p>
         <div className="bg-primary/5 p-6 rounded-2xl mb-8 border border-primary/10">
            <p className="text-sm font-black text-primary">
               يرجى التوجه إلى "بوابة المراجع" لمشاهدة سجلك الطبي.
            </p>
         </div>
         <button onClick={handleLogout} className="btn btn-error btn-block">تسجيل الخروج</button>
      </div>
    </div>
  );
};

export default Dashboard;
