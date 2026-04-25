import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../store/useAuthStore';
import useQueueStore from '../store/useQueueStore';
import useToastStore from '../store/useToastStore';
import Skeleton from '../components/UI/Skeleton';

const ReceptionDashboard = () => {
  const { user } = useAuthStore();
  const { queue, loading, initSocket, disconnectSocket, fetchQueue, addToQueue } = useQueueStore();
  const { addToast } = useToastStore();
  const [nationalId, setNationalId] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cId = user?.clinic?.id || user?.clinicId;
    if (cId) {
      fetchQueue(cId);
      initSocket(cId);
    }
    return () => disconnectSocket();
  }, [user]);

  const handleAddToQueue = async (e) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);
    
    const cId = user?.clinic?.id || user?.clinicId;
    const result = await addToQueue(cId, nationalId);
    
    if (result.success) {
      setNationalId('');
      addToast('تمت إضافة المراجع بنجاح');
    } else {
      const msg = result.message === 'Patient not found. Citizen must be registered in NHR.' 
        ? 'المراجع غير موجود في السجل الوطني' 
        : result.message;
      setError(msg);
      addToast(msg, 'error');
    }
    setLocalLoading(false);
  };

  return (
    <Layout>
      {/* Warm Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="card p-8 bg-gradient-to-br from-white to-teal-50/30">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-3xl shadow-inner">👥</div>
              <div>
                 <p className="text-sm font-bold text-stone-400 uppercase tracking-widest leading-none">إجمالي المراجعين</p>
                 <h3 className="text-4xl font-black text-stone-900 mt-2">{queue.length}</h3>
              </div>
           </div>
        </div>
        <div className="card p-8 bg-gradient-to-br from-white to-amber-50/30">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center text-3xl shadow-inner">⌛</div>
              <div>
                 <p className="text-sm font-bold text-stone-400 uppercase tracking-widest leading-none">في الانتظار</p>
                 <h3 className="text-4xl font-black text-amber-600 mt-2">{queue.filter(q => q.status === 'WAITING').length}</h3>
              </div>
           </div>
        </div>
        <div className="card p-8 bg-gradient-to-br from-white to-rose-50/30">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-rose-500/10 rounded-3xl flex items-center justify-center text-3xl shadow-inner">🩺</div>
              <div>
                 <p className="text-sm font-bold text-stone-400 uppercase tracking-widest leading-none">قيد المعاينة</p>
                 <h3 className="text-4xl font-black text-rose-600 mt-2">{queue.filter(q => q.status === 'IN_SESSION').length}</h3>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Form */}
        <div className="lg:col-span-4">
          <div className="card p-10 sticky top-10 border border-stone-100 shadow-xl">
            <h2 className="text-2xl font-black text-stone-900 mb-2">تسجيل مراجع</h2>
            <p className="text-sm font-bold text-stone-400 mb-8 uppercase tracking-widest">إضافة فورية للطابور</p>
            
            <form onSubmit={handleAddToQueue} className="space-y-6">
              <div className="form-control">
                <input 
                  type="text" 
                  placeholder="الرقم الوطني للمراجع" 
                  className="input text-center text-xl font-black tracking-widest h-16 bg-stone-50" 
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                />
              </div>
              
              <button 
                className={`btn btn-primary btn-block h-16 text-lg font-black tracking-wide shadow-xl shadow-teal-500/20 ${localLoading ? 'loading' : ''}`}
                disabled={localLoading}
              >
                {localLoading ? '' : 'إضافة للطابور'}
              </button>
              
              {error && (
                <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl text-xs font-bold text-center border border-rose-100 animate-bounce">
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Live Queue List */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden border border-stone-100 shadow-xl">
            <div className="p-8 pb-4 flex justify-between items-center bg-stone-50/50">
               <h2 className="text-xl font-black text-stone-900">طابور الانتظار المباشر</h2>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">تحديث مباشر</span>
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="bg-stone-50/50">
                    <th className="px-8 py-6 text-right text-xs font-black text-stone-400 uppercase tracking-[0.2em]">الدور</th>
                    <th className="py-6 text-right text-xs font-black text-stone-400 uppercase tracking-[0.2em]">المراجع</th>
                    <th className="py-6 text-right text-xs font-black text-stone-400 uppercase tracking-[0.2em]">الحالة</th>
                    <th className="px-8 py-6 text-right text-xs font-black text-stone-400 uppercase tracking-[0.2em]">الوصول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-8 py-8"><Skeleton className="w-12 h-12 rounded-2xl" /></td>
                        <td className="py-8">
                           <Skeleton className="w-48 h-4 mb-2" />
                           <Skeleton className="w-32 h-3" />
                        </td>
                        <td className="py-8"><Skeleton className="w-20 h-8 rounded-xl" /></td>
                        <td className="px-8 py-8"><Skeleton className="w-16 h-4" /></td>
                      </tr>
                    ))
                  ) : queue.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-32 text-center">
                         <div className="text-5xl mb-4 opacity-20">📭</div>
                         <h3 className="text-xl font-black text-stone-300 uppercase tracking-widest">لا يوجد مراجعين حالياً</h3>
                      </td>
                    </tr>
                  ) : (
                    queue.map((item) => (
                      <tr key={item.id} className="hover:bg-teal-50/30 transition-colors group">
                        <td className="px-8 py-8">
                           <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-xl text-primary border border-stone-200 group-hover:bg-primary group-hover:text-white transition-all">
                             {item.queueNumber}
                           </div>
                        </td>
                        <td className="py-8">
                           <div className="font-black text-lg text-stone-900">{item.patient.user.fullName}</div>
                           <div className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest font-mono">{item.patient.nationalId}</div>
                        </td>
                        <td className="py-8">
                           <span className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm ${
                             item.status === 'WAITING' 
                               ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                               : 'bg-teal-50 text-teal-600 border border-teal-100'
                           }`}>
                             {item.status === 'WAITING' ? 'في الانتظار' : 'عند الطبيب'}
                           </span>
                        </td>
                        <td className="px-8 py-8 text-sm font-black text-stone-400">
                           {new Date(item.date).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReceptionDashboard;
