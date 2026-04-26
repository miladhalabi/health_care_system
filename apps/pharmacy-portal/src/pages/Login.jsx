import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '@nhr/shared';

const Login = () => {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(nationalId, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message === 'Invalid National ID or Password' 
        ? 'الرقم الوطني أو كلمة المرور غير صحيحة' 
        : 'فشل في الاتصال بالنظام');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-200 px-6 relative overflow-hidden font-cairo" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]"></div>
      
      <div className="w-full max-w-[440px] z-10">
        <Card className="p-10 lg:p-14 border-slate-200 shadow-premium">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-card mb-6">
              Rx
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">بوابة الصيدلية</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">نظام صرف الأدوية الإلكتروني</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="الرقم الوطني"
              placeholder="أدخل رقمك الوطني"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              className="text-center text-lg font-black tracking-widest"
            />
            
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-center text-lg"
            />
            
            {error && (
              <div className="p-3 bg-rose-50 text-rose-500 rounded-xl text-[11px] font-bold text-center border border-rose-100 animate-in fade-in zoom-in-95 duration-300">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              className="w-full h-14 text-md shadow-card"
              loading={loading}
            >
              تسجيل الدخول للنظام
            </Button>
          </form>

          <div className="mt-12 text-center opacity-50">
             <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">الجمهورية العربية السورية - وزارة الصحة</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
