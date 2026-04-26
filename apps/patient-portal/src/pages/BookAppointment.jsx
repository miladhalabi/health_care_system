import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Button, 
  Card, 
  Input, 
  TimeSlotPicker, 
  Badge,
  cn,
  formatArabicDate 
} from '@nhr/shared';
import api from '../api/axios';
import { format, addDays } from 'date-fns';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [searchMode, setSearchMode] = useState('clinic'); // 'clinic' or 'doctor'
  
  // Master Data
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  
  // Selection
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ query: '', specialtyId: '', govId: '' });

  useEffect(() => {
    fetchInitialData();
  }, [searchMode, filters.specialtyId, filters.govId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [specRes, govRes] = await Promise.all([
        api.get('/general/specialties'),
        api.get('/general/governorates')
      ]);
      setSpecialties(specRes.data);
      setGovernorates(govRes.data);

      if (searchMode === 'clinic') {
        const res = await api.get('/general/clinics');
        setClinics(res.data);
      } else {
        const res = await api.get('/patient/doctors', {
          params: { specialtyId: filters.specialtyId }
        });
        setDoctors(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClinic = async (clinic) => {
    setSelectedClinic(clinic);
    setLoading(true);
    try {
      const res = await api.get(`/clinic/doctors/${clinic.id}`);
      setDoctors(res.data);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setLoading(true);
    try {
      const res = await api.get(`/patient/doctors/${doctor.id}/clinics`);
      setClinics(res.data);
      setStep(searchMode === 'doctor' ? 1 : 2);
      if (searchMode === 'clinic') {
        fetchSlots(doctor.id, selectedClinic.id, selectedDate);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinalLocationSelection = (clinic) => {
    setSelectedClinic(clinic);
    fetchSlots(selectedDoctor.id, clinic.id, selectedDate);
    setStep(2);
  };

  const fetchSlots = async (doctorId, clinicId, date) => {
    setLoading(true);
    try {
      const res = await api.get(`/clinic/availability/${doctorId}?date=${date}&clinicId=${clinicId}`);
      setSlots(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [slots, setSlots] = useState([]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    fetchSlots(selectedDoctor.id, selectedClinic.id, date);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      await api.post('/patient/book', {
        clinicId: selectedClinic.id,
        doctorId: selectedDoctor.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في الحجز');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClinics = clinics.filter(c => 
    (c.name.includes(filters.query) || c.address.includes(filters.query)) &&
    (!filters.govId || c.governorateId === filters.govId)
  );

  const filteredDoctors = doctors.filter(d => 
    d.fullName.includes(filters.query)
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        
        {/* Step Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')} className="text-xs">
            {step === 0 ? '← العودة للسجل' : 'رجوع'}
          </Button>
          <div className="text-center flex-1">
             <h1 className="text-2xl font-black text-zinc-900">حجز موعد جديد</h1>
             <div className="flex items-center justify-center gap-2 mt-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-500", step === i ? "w-8 bg-primary" : "w-1.5 bg-zinc-200")}></div>
                ))}
             </div>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Step 0: Search Path Selection */}
        {step === 0 && (
          <div className="space-y-6">
            <Card className="p-1.5 flex gap-1.5">
               <button 
                 onClick={() => { setSearchMode('clinic'); setFilters({ ...filters, query: '' }); }}
                 className={cn("flex-1 h-12 rounded-xl font-black text-[13px] transition-all", searchMode === 'clinic' ? "bg-primary text-white shadow-soft" : "text-zinc-400 hover:text-zinc-600")}
               >بحث حسب العيادة</button>
               <button 
                 onClick={() => { setSearchMode('doctor'); setFilters({ ...filters, query: '' }); }}
                 className={cn("flex-1 h-12 rounded-xl font-black text-[13px] transition-all", searchMode === 'doctor' ? "bg-primary text-white shadow-soft" : "text-zinc-400 hover:text-zinc-600")}
               >بحث حسب الطبيب</button>
            </Card>

            <Card className="p-6">
               <div className="flex flex-col md:flex-row gap-4">
                  <Input 
                    placeholder={searchMode === 'clinic' ? "ابحث عن اسم العيادة..." : "ابحث عن اسم الطبيب..."}
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    className="flex-1"
                  />
                  {searchMode === 'doctor' && (
                    <select 
                      className="select bg-zinc-50 h-12 rounded-xl font-bold border border-zinc-100 px-4 text-sm"
                      value={filters.specialtyId}
                      onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
                    >
                      <option value="">جميع التخصصات</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
                    </select>
                  )}
                  {searchMode === 'clinic' && (
                    <select 
                      className="select bg-zinc-50 h-12 rounded-xl font-bold border border-zinc-100 px-4 text-sm"
                      value={filters.govId}
                      onChange={(e) => setFilters({ ...filters, govId: e.target.value })}
                    >
                      <option value="">جميع المحافظات</option>
                      {governorates.map(g => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
                    </select>
                  )}
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {loading ? (
                 <div className="col-span-2 py-12 text-center">
                    <span className="loading loading-spinner text-primary"></span>
                 </div>
               ) : searchMode === 'clinic' ? (
                 filteredClinics.map(clinic => (
                   <div key={clinic.id} onClick={() => handleSelectClinic(clinic)} className="card-nhr p-6 cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-white transition-all">🏥</div>
                        <Badge variant="stone">{clinic.governorate?.nameAr}</Badge>
                      </div>
                      <h3 className="text-lg font-black text-zinc-900 leading-tight">{clinic.name}</h3>
                      <p className="text-zinc-400 font-bold mt-1 text-xs">{clinic.address}</p>
                   </div>
                 ))
               ) : (
                 filteredDoctors.map(doctor => (
                   <div key={doctor.id} onClick={() => handleSelectDoctor(doctor)} className="card-nhr p-5 cursor-pointer group flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-100 shadow-soft">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.fullName}`} alt="avatar" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-zinc-900 leading-tight">د. {doctor.fullName}</h3>
                        <p className="text-primary text-[11px] font-bold mt-1">{doctor.specialty?.nameAr}</p>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Step 1: Intermediate Choice */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-zinc-900 text-center mb-6">
              {searchMode === 'clinic' ? `الأطباء المتوفرون في ${selectedClinic?.name}` : `العيادات التي يتواجد بها د. ${selectedDoctor?.fullName}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {loading ? (
                 <div className="col-span-2 py-12 text-center">
                    <span className="loading loading-spinner text-primary"></span>
                 </div>
               ) : searchMode === 'clinic' ? (
                 doctors.map(doctor => (
                   <div key={doctor.id} onClick={() => handleSelectDoctor(doctor)} className="card-nhr p-5 cursor-pointer flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-100"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.fullName}`} alt="avatar" /></div>
                      <div><h3 className="text-md font-black text-zinc-900 leading-tight">د. {doctor.fullName}</h3><p className="text-primary text-[11px] font-bold">{doctor.specialty?.nameAr}</p></div>
                   </div>
                 ))
               ) : (
                 clinics.map(clinic => (
                   <div key={clinic.id} onClick={() => handleFinalLocationSelection(clinic)} className="card-nhr p-6 cursor-pointer group">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-all">🏥</div>
                      <h3 className="text-lg font-black text-zinc-900 leading-tight">{clinic.name}</h3>
                      <p className="text-zinc-400 font-bold mt-1 text-xs">{clinic.address} — {clinic.governorate?.nameAr}</p>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && (
          <div className="space-y-8">
            <Card className="flex flex-col md:flex-row gap-8 items-center justify-between border-primary/20 bg-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white shadow-soft border border-zinc-100 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor?.fullName}`} alt="avatar" /></div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900">د. {selectedDoctor?.fullName}</h3>
                  <p className="text-zinc-500 font-bold text-xs mt-1">الموقع: <span className="text-primary font-black">{selectedClinic?.name}</span></p>
                </div>
              </div>
              
              <div className="flex gap-2 bg-white/50 p-2 rounded-2xl">
                {[0, 1, 2, 3, 4].map(offset => {
                  const date = addDays(new Date(), offset);
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateKey;
                  return (
                    <button key={offset} onClick={() => handleDateChange(dateKey)} className={cn("flex flex-col items-center justify-center w-14 h-16 rounded-xl transition-all border", isSelected ? "bg-primary border-primary text-white shadow-card" : "bg-white border-zinc-100 text-zinc-400 hover:border-primary/30")}>
                      <span className="text-[9px] font-black uppercase mb-0.5">{format(date, 'EEE')}</span>
                      <span className="text-lg font-black">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">المواعيد المتاحة ليوم {formatArabicDate(selectedDate)}</h3>
                 {selectedSlot && <Badge variant="primary" className="animate-in fade-in zoom-in-95 duration-300">تم اختيار: {selectedSlot.start}</Badge>}
               </div>
               <TimeSlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} loading={loading} />
            </div>

            <div className="pt-4">
              <Button className="w-full h-14 text-lg shadow-card" disabled={!selectedSlot || submitting} loading={submitting} onClick={handleConfirmBooking}>
                تأكيد حجز الموعد
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="p-12 text-center animate-in zoom-in-95 duration-500 border-emerald-100 bg-emerald-50/10">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-soft">✓</div>
            <h2 className="text-2xl font-black text-zinc-900 mb-2">تم الحجز بنجاح!</h2>
            <p className="text-zinc-500 font-medium mb-10 max-w-md mx-auto leading-relaxed text-sm">
              تم حجز موعدك مع د. {selectedDoctor?.fullName} في {selectedClinic?.name} يوم {formatArabicDate(selectedDate)} الساعة {selectedSlot?.start}.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={() => navigate('/dashboard')} className="h-12 text-sm">العودة للرئيسية</Button>
              <Button variant="ghost" onClick={() => setStep(0)} className="text-xs">حجز موعد آخر</Button>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default BookAppointment;
