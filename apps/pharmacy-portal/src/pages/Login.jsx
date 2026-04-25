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
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] px-6 relative overflow-hidden" dir="rtl">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-[460px] z-10">
        <Card className="p-12 lg:p-16">
          <div className="flex flex-col items-center mb-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-teal-700 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-teal-500/30 mb-8">
              Rx
            </div>
            <h2 className="text-3xl font-black text-stone-900 leading-tight">بوابة الصيدلية</h2>
            <p className="text-sm font-bold text-stone-400 mt-3 uppercase tracking-[0.2em]">نظام صرف الأدوية الإلكتروني</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Input
              label="الرقم الوطني"
              placeholder="أدخل رقمك الوطني"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
              className="text-center text-xl font-black tracking-widest"
            />
            
            <Input
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="text-center text-xl"
            />
            
            {error && (
              <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-[11px] font-black text-center border border-rose-100 animate-shake">
                {error}
              </div>
            )}

            <Button 
              type="submit"
              className="btn-block h-16 text-lg"
              loading={loading}
            >
              تسجيل الدخول للنظام
            </Button>
          </form>

          <div className="mt-14 text-center">
             <div className="w-12 h-1 bg-stone-100 mx-auto rounded-full mb-6"></div>
             <p className="text-[10px] text-stone-400 font-black uppercase tracking-[0.3em]">الجمهورية العربية السورية - وزارة الصحة</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
