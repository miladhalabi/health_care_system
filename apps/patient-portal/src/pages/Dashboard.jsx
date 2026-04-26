import { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Button, 
  Card, 
  Badge, 
  ReliabilityBadge,
  Skeleton, 
  formatArabicDate, 
  formatArabicTime 
} from '@nhr/shared';

const Dashboard = () => {
  const { user } = useAuthStore();
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

  const headerActions = (
    <div className="flex items-center gap-3">
       {loading ? (
         <Skeleton className="w-24 h-8 rounded-lg" />
       ) : (
         <ReliabilityBadge score={data?.reliabilityScore ?? 100} />
       )}
       <Badge variant="success" className="hidden sm:inline-flex">مواطن مفعل</Badge>
    </div>
  );

  return (
    <Layout headerActions={headerActions}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Appointments and History */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Upcoming Appointments Section */}
            <section className="space-y-6">
               <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  المواعيد القادمة
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : upcomingAppointments.length === 0 ? (
                    <Card className="md:col-span-2 p-8 text-center border-dashed flex flex-col items-center justify-center min-h-[120px]">
                       <p className="text-zinc-400 font-bold text-sm italic">لا توجد مواعيد محجوزة قريباً</p>
                       <Button variant="ghost" onClick={() => navigate('/book')} className="text-primary text-xs mt-2 font-black">احجز موعدك الأول الآن</Button>
                    </Card>
                  ) : (
                    upcomingAppointments.map(app => (
                      <Card key={app.id} className="p-6 hover:border-primary transition-all">
                         <div className="flex justify-between items-start mb-4">
                            {getAppointmentBadge(getDisplayStatus(app))}
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{formatArabicDate(app.startTime)}</span>
                         </div>
                         <h3 className="text-lg font-black text-zinc-900">د. {app.user?.fullName}</h3>
                         <p className="text-zinc-400 font-bold text-xs">{app.clinic.name}</p>
                         
                         <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center gap-2 text-primary">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            <span className="text-xs font-black uppercase tracking-widest">{formatArabicTime(app.startTime)}</span>
                         </div>
                      </Card>
                    ))
                  )}
               </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                 سجل الالتزام بالمواعيد
              </h2>

              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : recentAttendance.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <p className="text-zinc-400 font-bold text-sm italic">لا توجد نتائج حضور أو غياب مسجلة بعد</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentAttendance.map((app) => (
                    <Card key={app.id} className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        {getAppointmentBadge(getDisplayStatus(app))}
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          {formatArabicDate(app.startTime)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-zinc-900">د. {app.user?.fullName}</h3>
                      <p className="text-zinc-400 font-bold text-xs">{app.clinic.name}</p>
                      <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center gap-2 text-primary">
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
              <h2 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                 <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                 سجل المعاينات الطبية
              </h2>

              {loading ? (
                [...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))
              ) : !data?.encounters || data.encounters.length === 0 ? (
                <Card className="p-20 text-center flex flex-col items-center">
                   <div className="text-5xl mb-6 opacity-10">📄</div>
                   <p className="text-zinc-300 font-black uppercase tracking-widest">لا توجد زيارات مسجلة حتى الآن</p>
                </Card>
              ) : (
                data.encounters.map((visit) => (
                  <Card key={visit.id} className="p-8 hover:shadow-premium transition-all group border-zinc-100">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{formatArabicDate(visit.date, { weekday: 'long' })}</span>
                           <h3 className="text-xl font-black text-zinc-900 mt-1">{visit.diagnosis}</h3>
                        </div>
                        <Badge variant="stone">{visit.clinic.name}</Badge>
                     </div>

                     <div className="bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">الأعراض والشكوى</span>
                              <p className="text-sm font-bold text-zinc-600 leading-relaxed">{visit.symptoms}</p>
                           </div>
                           {visit.prescription && (
                             <div>
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">الوصفة الطبية الصادرة</span>
                                <div className="space-y-2">
                                   {visit.prescription.items.map((item, i) => (
                                     <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-zinc-100 shadow-soft">
                                        <span className="font-black text-zinc-800 text-xs">{item.drugName}</span>
                                        <Badge variant="primary" className="text-[9px]">{item.dosage}</Badge>
                                     </div>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                     
                     <div className="mt-6 pt-6 border-t border-zinc-50 flex justify-between items-center opacity-60">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-[9px] font-black text-zinc-400">Dr</div>
                           <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">بإشراف الطبيب: {visit.doctor.fullName}</span>
                        </div>
                     </div>
                  </Card>
                ))
              )}
            </section>
          </div>

          {/* Right Side: Health Card */}
          <div className="lg:col-span-4 space-y-8">
             <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">بطاقة المراجع الصحية</h2>
             
             {loading ? (
               <Skeleton className="h-80 w-full rounded-2xl" />
             ) : (
               <div className="card bg-primary text-white p-8 shadow-premium border-none relative overflow-hidden rounded-[2rem]">
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
                        <div className="flex justify-between items-end border-t border-white/10 pt-4">
                           <div>
                             <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">عدد مرات الغياب</p>
                             <p className="text-lg font-black">{data?.missedAppointments ?? 0}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[10px] font-black text-teal-100 uppercase tracking-widest mb-1">نقاط الالتزام</p>
                             <p className="text-lg font-black">{data?.reliabilityScore ?? 100}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             <Card className="bg-white">
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest mb-4">صرف الأدوية</h4>
                <p className="text-xs font-bold text-zinc-400 leading-relaxed">
                   يمكنك صرف وصفتك الطبية من أي صيدلية في الجمهورية العربية السورية بمجرد إبراز رقمك الوطني.
                </p>
                <div className="mt-6 flex justify-center opacity-10">
                   <div className="text-4xl text-primary">💊</div>
                </div>
             </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
