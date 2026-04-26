import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Button, 
  Card, 
  Badge, 
  Input, 
  Skeleton, 
  cn 
} from '@nhr/shared';
import useAuthStore from '../store/useAuthStore';
import useToastStore from '../store/useToastStore';
import api from '../api/axios';

const DAYS = [
  { id: 0, name: 'الأحد' },
  { id: 1, name: 'الاثنين' },
  { id: 2, name: 'الثلاثاء' },
  { id: 3, name: 'الأربعاء' },
  { id: 4, name: 'الخميس' },
  { id: 5, name: 'الجمعة' },
  { id: 6, name: 'السبت' },
];

const MyRotation = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [config, setConfig] = useState({ rotation: [] });
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    clinicId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '14:00',
    slotDuration: 20
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, clinicsRes] = await Promise.all([
        api.get('/doctor/config'),
        api.get('/general/clinics') // Changed from /patient/clinics
      ]);
      setConfig(configRes.data);
      setClinics(clinicsRes.data);
    } catch (err) {
      console.error(err);
      addToast('خطأ في تحميل بيانات المناوبات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/doctor/schedules', formData);
      addToast('تم تحديث الجدول بنجاح');
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'خطأ في الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد؟ سيتم إلغاء المواعيد المحجوزة في هذه الفترة.')) return;
    try {
      await api.delete(`/doctor/schedules/${id}`);
      addToast('تم حذف الفترة بنجاح');
      fetchData();
    } catch (err) {
      addToast('خطأ في الحذف', 'error');
    }
  };

  const handleSwitchSession = async (clinicId) => {
    try {
      await api.patch('/doctor/active-session', { clinicId });
      addToast('تم تحديث مقر العمل الحالي');
      fetchData();
    } catch (err) {
      addToast('خطأ في تحديث الجلسة', 'error');
    }
  };

  if (loading) return <Layout><Skeleton className="h-screen w-full" /></Layout>;

  const activeClinics = config?.rotation 
    ? Array.from(new Map(config.rotation.map(r => [r.clinic?.id, r.clinic])).values()).filter(Boolean)
    : [];

  return (
    <Layout>
      <div className="space-y-10">
        
        {/* Active Session Status */}
        <section>
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
             مقر العمل الحالي (الجلسة النشطة)
          </h2>
          <Card className="p-8 border-2 border-primary/20 bg-primary/5">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl animate-bounce-slow">📍</div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">
                        {config?.activeClinic?.name || 'غير محدد'}
                      </h3>
                      <p className="text-sm font-bold text-slate-500">
                        {config?.activeClinic 
                          ? `أنت متواجد حالياً في ${config.activeClinic.address}` 
                          : 'الرجاء تحديد العيادة التي تتواجد فيها الآن لتتمكن من استدعاء المرضى'}
                      </p>
                   </div>
                </div>
                
                <div className="flex gap-3">
                   <select 
                     className="select bg-white border-slate-200 h-14 rounded-2xl px-6 font-bold"
                     value={config?.activeClinic?.id || ''}
                     onChange={(e) => handleSwitchSession(e.target.value)}
                   >
                     <option value="">خارج الخدمة حالياً</option>
                     {activeClinics.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                </div>
             </div>
          </Card>
        </section>

        {/* Weekly Rotation Grid */}
        <section>
           <div className="flex justify-between items-end mb-8">
              <div>
                 <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    جدول المناوبات الأسبوعي
                 </h2>
                 <p className="text-xs font-bold text-slate-400 mt-2">قم بإدارة تواجدك في المراكز الطبية المختلفة</p>
              </div>
              <Button onClick={() => setShowModal(true)}>+ إضافة فترة عمل</Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS.map(day => {
                const daySchedules = config?.rotation ? config.rotation.filter(r => r.dayOfWeek === day.id) : [];
                return (
                  <div key={day.id} className="space-y-4">
                     <div className="text-center p-3 bg-slate-100 rounded-xl font-black text-xs text-slate-500 uppercase">{day.name}</div>
                     <div className="space-y-3">
                        {daySchedules.length === 0 ? (
                          <div className="h-20 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center opacity-20 text-[10px] font-bold">لا يوجد</div>
                        ) : daySchedules.map(sched => (
                          <div key={sched.id} className="card-nhr p-4 bg-white border border-slate-100 relative group overflow-hidden">
                             <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-50"></div>
                             <p className="text-[10px] font-black text-primary truncate">{sched.clinic?.name}</p>
                             <p className="text-xs font-bold text-slate-900 mt-1">{sched.startTime} - {sched.endTime}</p>
                             <div className="flex justify-between items-center mt-3">
                                <span className="text-[9px] font-bold text-slate-400">{sched.slotDuration} د/مريض</span>
                                <button onClick={() => handleDelete(sched.id)} className="opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:scale-110">
                                   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                );
              })}
           </div>
        </section>

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
             <Card className="max-w-lg w-full p-10 shadow-2xl relative">
                <button onClick={() => setShowModal(false)} className="absolute top-8 left-8 text-slate-400 hover:text-slate-900 font-bold">✕</button>
                <h3 className="text-2xl font-black text-slate-900 mb-8">إضافة فترة عمل جديدة</h3>
                
                <form onSubmit={handleSaveSchedule} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase mr-2">المركز الطبي / العيادة</label>
                      <select 
                        required
                        className="select bg-slate-50 w-full rounded-2xl h-14 font-bold border-none"
                        value={formData.clinicId}
                        onChange={(e) => setFormData({ ...formData, clinicId: e.target.value })}
                      >
                        <option value="">اختر العيادة...</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name} - {c.address}</option>)}
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">اليوم</label>
                        <select 
                          className="select bg-slate-50 w-full rounded-2xl h-14 font-bold border-none"
                          value={formData.dayOfWeek}
                          onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                        >
                          {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">مدة المعاينة (دقائق)</label>
                        <Input 
                          type="number" 
                          value={formData.slotDuration} 
                          onChange={(e) => setFormData({ ...formData, slotDuration: parseInt(e.target.value) })}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">وقت البدء</label>
                        <Input 
                          type="time" 
                          value={formData.startTime} 
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">وقت الانتهاء</label>
                        <Input 
                          type="time" 
                          value={formData.endTime} 
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        />
                      </div>
                   </div>

                   <div className="pt-6">
                      <Button type="submit" className="btn-block h-16" loading={saving}>حفظ الفترة</Button>
                   </div>
                </form>
             </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyRotation;
