import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Badge, 
  Skeleton, 
  formatArabicDate, 
  formatArabicTime 
} from '@nhr/shared';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, appsRes] = await Promise.all([
        api.get('/patient/records'),
        api.get('/patient/appointments')
      ]);
      setData(recordsRes.data);
      setAppointments(appsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDisplayStatus = (appointment) => appointment.status === 'DONE' ? 'ATTENDED' : appointment.status;

  const getAppointmentBadge = (status) => {
    if (status === 'BOOKED') return <Badge variant="primary">موعد محجوز</Badge>;
    if (status === 'WAITING') return <Badge variant="warning">تم تسجيل الحضور</Badge>;
    if (status === 'IN_SESSION') return <Badge variant="warning">قيد المعاينة</Badge>;
    if (status === 'ATTENDED') return <Badge variant="success">تم الحضور</Badge>;
    if (status === 'NO_SHOW') return <Badge variant="error">غياب</Badge>;
    return <Badge>موعد</Badge>;
  };

  const upcomingAppointments = appointments.filter((app) => {
    const status = getDisplayStatus(app);
    return ['BOOKED', 'WAITING', 'IN_SESSION'].includes(status);
  });

  const recentAttendance = appointments.filter((app) => {
    const status = getDisplayStatus(app);
    return ['ATTENDED', 'NO_SHOW'].includes(status);
  });

  return (
    <div className="min-h-screen bg-stone-50 p-6 lg:p-12 font-cairo" dir="rtl">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navigation */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-white gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-teal-500/20">P</div>
             <div>
                {loading ? (
                  <>
                    <Skeleton className="w-32 h-6 mb-2" />
                    <Skeleton className="w-24 h-3" />
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-black text-stone-900 leading-tight">{data?.user?.fullName || user?.fullName}</h1>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">رقم وطني: {data?.nationalId || user?.nationalId}</p>
                  </>
                )}
             </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge variant="success">مواطن مفعل</Badge>
             <Button onClick={() => navigate('/book')} className="h-10 px-6 font-bold">حجز موعد</Button>
             <Button variant="ghost" onClick={handleLogout} className="text-rose-500 text-xs">خروج</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Appointments and History */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Upcoming Appointments Section */}
            <section className="space-y-6">
               <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  المواعيد القادمة
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : upcomingAppointments.length === 0 ? (
                    <Card className="md:col-span-2 p-8 text-center bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center min-h-[120px]">
                       <p className="text-stone-400 font-bold text-sm italic">لا توجد مواعيد محجوزة قريباً</p>
                       <Button variant="ghost" onClick={() => navigate('/book')} className="text-primary text-xs mt-2 font-black">احجز موعدك الأول الآن</Button>
                    </Card>
                  ) : (
                    upcomingAppointments.map(app => (
                      <Card key={app.id} className="p-6 border border-stone-100 hover:border-primary transition-all">
                         <div className="flex justify-between items-start mb-4">
                            {getAppointmentBadge(getDisplayStatus(app))}
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{formatArabicDate(app.startTime)}</span>
                         </div>
                         <h3 className="text-lg font-black text-stone-900">د. {app.user?.fullName}</h3>
                         <p className="text-stone-400 font-bold text-xs">{app.clinic.name}</p>
                         
                         <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-2 text-primary">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-xs font-black uppercase tracking-widest">{formatArabicTime(app.startTime)}</span>
                         </div>
                      </Card>
                    ))
                  )}
               </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-sm font-black text-stone-400 uppercase tracking-widest flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-stone-300"></span>
                 سجل الالتزام بالمواعيد
              </h2>

              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : recentAttendance.length === 0 ? (
                <Card className="p-8 text-center bg-stone-50 border-2 border-dashed border-stone-200">
                  <p className="text-stone-400 font-bold text-sm italic">لا توجد نتائج حضور أو غياب مسجلة بعد</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentAttendance.map((app) => (
                    <Card key={app.id} className="p-6 border border-stone-100">
                      <div className="flex justify-between items-start mb-4">
                        {getAppointmentBadge(getDisplayStatus(app))}
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                          {formatArabicDate(app.startTime)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-stone-900">د. {app.user?.fullName}</h3>
                      <p className="text-stone-400 font-bold text-xs">{app.clinic.name}</p>
                      <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-2 text-primary">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="text-xs font-black uppercase tracking-widest">{formatArabicTime(app.startTime)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Medical History Section */}
            <section className="space-y-6">
              <h2 className="text-sm font-black text-stone-400 uppercase tracking-widest flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-stone-300"></span>
                 سجل المعاينات الطبية
              </h2>

              {loading ? (
                [...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))
              ) : !data?.encounters || data.encounters.length === 0 ? (
                <Card className="p-20 text-center flex flex-col items-center">
                   <div className="text-6xl mb-6 opacity-10">📄</div>
                   <p className="text-stone-300 font-black uppercase tracking-widest">لا توجد زيارات مسجلة حتى الآن</p>
                </Card>
              ) : (
                data.encounters.map((visit) => (
                  <Card key={visit.id} className="p-10 hover:shadow-2xl transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{formatArabicDate(visit.date, { weekday: 'long' })}</span>
                           <h3 className="text-2xl font-black text-stone-900 mt-2">{visit.diagnosis}</h3>
                        </div>
                        <Badge>{visit.clinic.name}</Badge>
                     </div>

                     <div className="bg-stone-50/50 p-6 rounded-[1.5rem] border border-stone-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">الأعراض والشكوى</span>
                              <p className="text-sm font-bold text-stone-600 leading-relaxed">{visit.symptoms}</p>
                           </div>
                           {visit.prescription && (
                             <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">الوصفة الطبية الصادرة</span>
                                <div className="space-y-2">
                                   {visit.prescription.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                        <span className="font-black text-stone-800 text-xs">{item.drugName}</span>
                                        <Badge variant="primary">{item.dosage}</Badge>
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                     
                     <div className="mt-6 pt-6 border-t border-stone-50 flex justify-between items-center opacity-60">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-black text-stone-400">Dr</div>
                           <span className="text-xs font-bold text-stone-500 uppercase tracking-tight">بإشراف الطبيب: {visit.doctor.fullName}</span>
                        </div>
                     </div>
                  </Card>
                ))
              )}
            </section>
          </div>

          {/* Right Side: Health Card */}
          <div className="lg:col-span-4 space-y-8">
             <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest">بطاقة المراجع الصحية</h2>
             
             {loading ? (
               <Skeleton className="h-80 w-full" />
             ) : (
               <div className="card bg-primary text-white p-8 shadow-xl shadow-teal-500/30 border-none relative overflow-hidden rounded-[2.5rem]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                     <div className="mb-8">
                        <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">زمرة الدم</p>
                        <h4 className="text-5xl font-black">{data?.bloodType || '--'}</h4>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">الحساسية المعروفة</p>
                           <p className="text-sm font-bold bg-white/10 p-3 rounded-xl inline-block">{data?.allergies || 'لا توجد سجلات'}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">الأمراض المزمنة</p>
                           <p className="text-sm font-bold bg-white/10 p-3 rounded-xl inline-block">{data?.chronicDiseases || 'لا توجد سجلات'}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">عدد مرات الغياب</p>
                           <p className="text-sm font-bold bg-white/10 p-3 rounded-xl inline-block">{data?.missedAppointments ?? 0}</p>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             <Card className="bg-white border border-stone-100">
                <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest mb-4">صرف الأدوية</h4>
                <p className="text-xs font-bold text-stone-400 leading-relaxed">
                   يمكنك صرف وصفتك الطبية من أي صيدلية في الجمهورية العربية السورية بمجرد إبراز رقمك الوطني.
                </p>
                <div className="mt-6 flex justify-center opacity-20">
                   <div className="text-5xl">💊</div>
                </div>
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
