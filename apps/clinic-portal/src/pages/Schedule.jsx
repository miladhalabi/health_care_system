import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  Button, 
  Card, 
  Badge, 
  Skeleton, 
  formatArabicDate, 
  formatArabicTime 
} from '@nhr/shared';
import useAuthStore from '../store/useAuthStore';
import useToastStore from '../store/useToastStore';
import api from '../api/axios';
import { format, addDays, subDays } from 'date-fns';

const Schedule = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  // The clinic context depends on the role: 
  // Receptionists use their fixed clinicId, Doctors use their activeClinicId
  const currentClinicId = user?.role === 'RECEPTIONIST' ? user.clinicId : user?.activeClinicId;
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDoctorId, setSelectedDoctorId] = useState(user?.role === 'DOCTOR' ? user.id : '');

  const getDisplayStatus = (appointment) => appointment.status === 'DONE' ? 'ATTENDED' : appointment.status;

  useEffect(() => {
    if (currentClinicId) {
      fetchDoctors();
    }
  }, [currentClinicId]);

  useEffect(() => {
    if (currentClinicId) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctorId, currentClinicId]);

  const fetchDoctors = async () => {
    try {
      const res = await api.get(`/clinic/doctors/${currentClinicId}`);
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/clinic/appointments/${currentClinicId}`, {
        params: {
          date: selectedDate,
          doctorId: selectedDoctorId || undefined
        }
      });
      setAppointments(res.data);
    } catch (err) {
      addToast('خطأ في تحميل المواعيد', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (appId) => {
    setActionLoading(appId);
    try {
      await api.patch(`/clinic/queue/check-in/${appId}`);
      addToast('تم تسجيل حضور المريض وإضافته للطابور');
      fetchAppointments();
    } catch (err) {
      addToast('خطأ في تسجيل الحضور', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttendance = async (appId, outcome) => {
    setActionLoading(`${appId}:${outcome}`);
    try {
      await api.patch(`/clinic/appointments/${appId}/attendance`, { outcome });
      addToast(outcome === 'NO_SHOW' ? 'تم تسجيل الموعد كغياب' : 'تم تثبيت حضور الموعد');
      fetchAppointments();
    } catch (err) {
      addToast(err.response?.data?.message || 'خطأ في تحديث الحضور', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Layout>
      {!currentClinicId ? (
        <Card className="p-20 text-center flex flex-col items-center">
           <div className="text-5xl mb-6">📍</div>
           <h3 className="text-xl font-black text-stone-900 mb-4">الرجاء تحديد مقر العمل الحالي</h3>
           <p className="text-stone-500 font-bold max-w-md">
             يجب عليك اختيار العيادة التي تتواجد فيها الآن من القائمة في الأعلى لعرض جدول المواعيد.
           </p>
        </Card>
      ) : (
        <div className="space-y-8">
          
          {/* Filters Bar */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
              <div className="flex gap-4 flex-1">
                <div className="flex-1 space-y-2">
                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mr-2">التاريخ</label>
                   <input 
                     type="date" 
                     className="input bg-stone-50 w-full" 
                     value={selectedDate}
                     onChange={(e) => setSelectedDate(e.target.value)}
                   />
                </div>
                
                {user?.role === 'RECEPTIONIST' && (
                  <div className="flex-1 space-y-2">
                     <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mr-2">الطبيب</label>
                     <select 
                       className="select bg-stone-50 w-full rounded-2xl font-bold border-none h-14"
                       value={selectedDoctorId}
                       onChange={(e) => setSelectedDoctorId(e.target.value)}
                     >
                       <option value="">جميع الأطباء</option>
                       {doctors.map(d => (
                         <option key={d.id} value={d.id}>{d.fullName}</option>
                       ))}
                     </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                 <Button variant="ghost" onClick={() => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>السابق</Button>
                 <Button variant="ghost" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>اليوم</Button>
                 <Button variant="ghost" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}>التالي</Button>
              </div>
            </div>
          </Card>

          {/* Schedule List */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-stone-400 uppercase tracking-widest flex items-center gap-3">
               <span className="w-2 h-2 rounded-full bg-primary"></span>
               مواعيد يوم {formatArabicDate(selectedDate)}
            </h2>

            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            ) : appointments.length === 0 ? (
              <Card className="p-20 text-center flex flex-col items-center">
                 <div className="text-5xl mb-6 opacity-10">📅</div>
                 <p className="text-stone-300 font-black uppercase tracking-widest">لا توجد مواعيد محجوزة لهذا اليوم</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((app) => (
                  (() => {
                    const displayStatus = getDisplayStatus(app);
                    const slotEnded = app.endTime ? new Date(app.endTime) <= new Date() : false;

                    return (
                  <Card key={app.id} className="p-0 overflow-hidden border border-stone-100 hover:border-primary/30 transition-all group">
                     <div className="flex items-stretch">
                        {/* Time Block */}
                        <div className="w-32 bg-stone-50 flex flex-col items-center justify-center border-l border-stone-100 group-hover:bg-primary/5 transition-colors">
                           <span className="text-xl font-black text-stone-900">{formatArabicTime(app.startTime)}</span>
                           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">بداية الموعد</span>
                        </div>

                        {/* Info Block */}
                        <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                           <div className="flex items-center gap-6">
                              <div className="avatar">
                                 <div className="w-14 h-14 rounded-2xl ring ring-stone-50">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.patient.user.fullName}`} alt="avatar" />
                                 </div>
                              </div>
                              <div>
                                 <h3 className="text-lg font-black text-stone-900">{app.patient.user.fullName}</h3>
                                 <p className="text-xs font-bold text-stone-400 uppercase">رقم وطني: {app.patient.nationalId}</p>
                              </div>
                           </div>

                           <div className="flex items-center gap-8">
                              {user?.role === 'RECEPTIONIST' && (
                                <div className="text-right hidden md:block">
                                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">الطبيب المعالج</p>
                                   <p className="text-sm font-bold text-primary">د. {app.user?.fullName}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4">
                                 {displayStatus === 'WAITING' ? (
                                   <Badge variant="primary">في الطابور</Badge>
                                 ) : displayStatus === 'IN_SESSION' ? (
                                   <Badge variant="warning">قيد المعاينة</Badge>
                                 ) : displayStatus === 'ATTENDED' ? (
                                   <Badge variant="success">تم الحضور</Badge>
                                 ) : displayStatus === 'NO_SHOW' ? (
                                   <Badge variant="error">غياب</Badge>
                                 ) : displayStatus === 'BOOKED' ? (
                                   <div className="flex items-center gap-2">
                                     <Badge>محجوز</Badge>
                                     <Button 
                                       onClick={() => handleCheckIn(app.id)}
                                       loading={actionLoading === app.id}
                                       className="h-10 px-6 text-xs"
                                     >
                                       تسجيل حضور
                                     </Button>
                                     <Button
                                       variant="danger"
                                       onClick={() => handleAttendance(app.id, 'NO_SHOW')}
                                       loading={actionLoading === `${app.id}:NO_SHOW`}
                                       className="h-10 px-4 text-xs"
                                       disabled={!slotEnded}
                                     >
                                       غياب
                                     </Button>
                                   </div>
                                 ) : (
                                   <Button
                                     onClick={() => handleAttendance(app.id, 'ATTENDED')}
                                     loading={actionLoading === `${app.id}:ATTENDED`}
                                     className="h-10 px-6 text-xs"
                                   >
                                     تثبيت الحضور
                                   </Button>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>
                  </Card>
                    );
                  })()
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Schedule;
