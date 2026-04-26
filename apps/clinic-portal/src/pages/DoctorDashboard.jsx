import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PatientHistory from '../components/PatientHistory';
import { Card, Button, Badge, Skeleton } from '@nhr/shared';
import useAuthStore from '../store/useAuthStore';
import useQueueStore from '../store/useQueueStore';
import useToastStore from '../store/useToastStore';
import api from '../api/axios';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const { queue, initSocket, disconnectSocket, fetchQueue, callPatient, loading } = useQueueStore();
  const { addToast } = useToastStore();
  
  const currentClinicId = user?.role === 'RECEPTIONIST' ? user.clinicId : user?.activeClinicId;

  const [isEncountering, setIsEncountering] = useState(false);
  const [history, setHistory] = useState([]);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([{ drugName: '', dosage: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  const activePatient = queue.find(q => q.status === 'IN_SESSION');
  const waitingList = queue.filter(q => q.status === 'WAITING');

  useEffect(() => {
    if (currentClinicId) {
      fetchQueue(currentClinicId);
      initSocket(currentClinicId);
    }
    // No disconnect here to allow room switching via initSocket
  }, [currentClinicId]);

  useEffect(() => {
    if (activePatient) {
      fetchPatientHistory(activePatient.patient.nationalId);
    } else {
      setIsEncountering(false);
      setHistory([]);
    }
  }, [activePatient]);

  const fetchPatientHistory = async (nationalId) => {
    try {
      const response = await api.get(`/clinic/patient/${nationalId}`);
      setHistory(response.data.encounters);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleCallNext = async () => {
    if (waitingList.length > 0) {
      const res = await callPatient(waitingList[0].id);
      if (res.success) {
        addToast('تمت مناداة المراجع التالي');
      }
    }
  };

  const addPrescriptionRow = () => {
    setPrescriptionItems([...prescriptionItems, { drugName: '', dosage: '', quantity: 1 }]);
  };

  const removePrescriptionRow = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const updatePrescriptionItem = (index, field, value) => {
    const newItems = [...prescriptionItems];
    newItems[index][field] = value;
    setPrescriptionItems(newItems);
  };

  const handleSubmitEncounter = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/clinic/encounter', {
        patientId: activePatient.patientId,
        symptoms,
        diagnosis,
        notes,
        prescriptionItems: prescriptionItems.filter(item => item.drugName !== ''),
        clinicId: currentClinicId
      });
      
      setSymptoms('');
      setDiagnosis('');
      setNotes('');
      setPrescriptionItems([{ drugName: '', dosage: '', quantity: 1 }]);
      setIsEncountering(false);
      addToast('تم حفظ المعاينة وإرسال الوصفة بنجاح');
      fetchQueue(currentClinicId);
    } catch (err) {
      addToast('خطأ في حفظ المعاينة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentClinicId) {
    return (
      <Layout>
        <Card className="p-20 text-center flex flex-col items-center">
           <div className="text-5xl mb-6">🏥</div>
           <h3 className="text-2xl font-black text-slate-900 mb-4">بوابة العيادة جاهزة</h3>
           <p className="text-slate-500 font-bold max-w-md">
             الرجاء تحديد العيادة التي تتواجد فيها الآن من القائمة العلوية للبدء باستقبال المرضى.
           </p>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Encounter Area */}
        <div className="lg:col-span-8">
          {loading && queue.length === 0 ? (
             <Skeleton className="h-64 w-full" />
          ) : !isEncountering ? (
            <>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                 <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                 المراجعة الحالية
              </h2>
              
              {activePatient ? (
                <Card className="p-12 relative overflow-hidden group">
                   <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                      <div className="avatar">
                        <div className="w-28 h-28 rounded-[2rem] ring ring-primary ring-offset-4">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activePatient.patient.user.fullName}`} alt="patient" />
                        </div>
                      </div>
                      <div className="flex-1 text-center md:text-right">
                        <Badge variant="primary" className="mb-2">رقم الدور: {activePatient.queueNumber}</Badge>
                        <h3 className="text-4xl font-black text-slate-900">{activePatient.patient.user.fullName}</h3>
                        <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-sm">الرقم الوطني: {activePatient.patient.nationalId}</p>
                        
                        <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                           <Badge>فئة الدم: {activePatient.patient.bloodType || 'غير معروف'}</Badge>
                           <Badge variant="error">حساسية: {activePatient.patient.allergies || 'لا يوجد'}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button onClick={() => setIsEncountering(true)} className="h-20 px-12 text-xl shadow-xl">بدأ المعاينة الآن</Button>
                        <Button variant="ghost" className="text-slate-400 font-bold">تأجيل المريض</Button>
                      </div>
                   </div>
                </Card>
              ) : (
                <Card className="p-24 border-2 border-dashed border-slate-200 text-center">
                   <div className="text-7xl mb-8 opacity-20">🏥</div>
                   <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">العيادة جاهزة لاستقبال المراجع التالي</h3>
                   {waitingList.length > 0 && (
                     <Button onClick={handleCallNext} className="mt-10 h-16 px-14 text-xl shadow-2xl">مناداة المريض التالي</Button>
                   )}
                </Card>
              )}
            </>
          ) : (
            /* Encounter Form */
            <div className="animate-in fade-in zoom-in-95 duration-500">
               {/* Sticky Patient Summary Banner */}
               <Card className="sticky top-0 z-20 mb-8 p-6 border-b-4 border-primary shadow-lg flex flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">👤</div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none">{activePatient.patient.user.fullName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">رقم وطني: {activePatient.patient.nationalId}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="text-center px-4 border-r border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">زمرة الدم</span>
                        <span className="text-sm font-black text-primary">{activePatient.patient.bloodType || '--'}</span>
                     </div>
                     <div className="text-center px-4">
                        <span className="text-[9px] font-black text-slate-400 uppercase block">الحساسية</span>
                        <span className="text-sm font-black text-rose-500">{activePatient.patient.allergies || 'لا يوجد'}</span>
                     </div>
                  </div>

                  <Button variant="ghost" onClick={() => setIsEncountering(false)} className="text-slate-300 hover:text-slate-900 text-[10px]">إلغاء الجلسة</Button>
               </Card>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="space-y-8">
                    <Card className="p-8">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">التشخيص السريري</h4>
                       <div className="space-y-6">
                          <div className="form-control">
                             <label className="label py-1"><span className="label-text font-bold text-slate-500 text-xs text-right w-full">الأعراض والشكوى</span></label>
                             <textarea 
                                className="textarea bg-slate-50 h-32 text-right font-bold text-slate-700 leading-relaxed border-transparent focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl"
                                placeholder="صف الأعراض التي يعاني منها المريض..."
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                                required
                             ></textarea>
                          </div>
                          <div className="form-control">
                             <label className="label py-1"><span className="label-text font-bold text-slate-500 text-xs text-right w-full">التشخيص النهائي</span></label>
                             <input 
                                type="text" 
                                className="input bg-slate-50 text-right font-black text-slate-800 border-transparent focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl h-14 px-6"
                                placeholder="اكتب التشخيص هنا..."
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                required
                             />
                          </div>
                       </div>
                    </Card>
                  </div>

                  <div className="space-y-8">
                    <Card className="p-8">
                       <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">الوصفة الطبية الإلكترونية</h4>
                       <div className="space-y-4">
                          {prescriptionItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end group">
                               <div className="flex-1 space-y-1">
                                  {index === 0 && <label className="text-[9px] font-bold text-slate-400 block mr-2">الدواء والجرعة</label>}
                                  <div className="join w-full">
                                    <input 
                                       type="text" 
                                       placeholder="اسم الدواء" 
                                       className="input input-sm join-item bg-slate-50 w-2/3 text-right" 
                                       value={item.drugName}
                                       onChange={(e) => updatePrescriptionItem(index, 'drugName', e.target.value)}
                                    />
                                    <input 
                                       type="text" 
                                       placeholder="الجرعة" 
                                       className="input input-sm join-item bg-slate-50 w-1/3 text-right text-[10px]" 
                                       value={item.dosage}
                                       onChange={(e) => updatePrescriptionItem(index, 'dosage', e.target.value)}
                                    />
                                  </div>
                               </div>
                               <div className="w-16 space-y-1">
                                  {index === 0 && <label className="text-[9px] font-bold text-slate-400 block mr-1">الكمية</label>}
                                  <input 
                                     type="number" 
                                     className="input input-sm bg-slate-50 w-full text-center font-bold" 
                                     value={item.quantity}
                                     onChange={(e) => updatePrescriptionItem(index, 'quantity', parseInt(e.target.value))}
                                  />
                               </div>
                               <button 
                                  onClick={() => removePrescriptionRow(index)} 
                                  className="btn btn-ghost btn-sm btn-square text-slate-300 hover:text-rose-500"
                                  disabled={prescriptionItems.length === 1}
                               >✕</button>
                            </div>
                          ))}
                          <Button variant="ghost" onClick={addPrescriptionRow} className="btn-block h-10 text-primary text-xs border-2 border-dashed border-slate-100">+ إضافة دواء آخر</Button>
                       </div>
                    </Card>

                    <Button 
                       onClick={handleSubmitEncounter}
                       disabled={submitting || !diagnosis || !symptoms}
                       className="btn-block h-20 text-xl shadow-2xl"
                       loading={submitting}
                    >
                       إتمام المعاينة وإرسالها للسجل الوطني
                    </Button>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar: History or Waiting Queue */}
        <div className="lg:col-span-4">
           {isEncountering ? (
              <div className="animate-in slide-in-from-left-5 duration-500">
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                   التاريخ الطبي للمراجع
                </h2>
                <Card className="p-8 max-h-[700px] overflow-y-auto scrollbar-hide">
                   <PatientHistory history={history} />
                </Card>
              </div>
           ) : (
              <div>
                 <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">قائمة الانتظار</h2>
                    <Badge>{waitingList.length} مريض</Badge>
                 </div>
                 
                 <Card className="p-0 overflow-hidden">
                    <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto scrollbar-hide">
                       {waitingList.length === 0 ? (
                          <div className="p-12 text-center opacity-30 font-bold italic">القائمة فارغة</div>
                       ) : (
                          waitingList.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center gap-4 group cursor-pointer" onClick={() => callPatient(item.id)}>
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                 {item.queueNumber}
                               </div>
                               <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 text-sm">{item.patient.user.fullName}</h4>
                                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.patient.nationalId}</p>
                                </div>
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-black text-primary uppercase">مناداة</span>
                               </div>
                            </div>
                          ))
                       )}
                    </div>
                 </Card>
              </div>
           )}
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
