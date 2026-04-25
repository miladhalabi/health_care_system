import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-stone-50 p-6 lg:p-12 font-cairo" dir="rtl">
      <div className="max-w-4xl mx-auto">
        
        {/* Step Header */}
        <div className="flex justify-between items-center mb-10">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : navigate('/dashboard')}>
            {step === 0 ? '← العودة للسجل' : 'رجوع'}
          </Button>
          <div className="text-center flex-1">
             <h1 className="text-3xl font-black text-stone-900">حجز موعد جديد</h1>
             <div className="flex items-center justify-center gap-2 mt-3">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", step === i ? "w-8 bg-primary" : "w-1.5 bg-stone-200")}></div>
                ))}
             </div>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Step 0: Search Path Selection */}
        {step === 0 && (
          <div className="space-y-8">
            <Card className="p-4 flex gap-2">
               <button 
                 onClick={() => { setSearchMode('clinic'); setFilters({ ...filters, query: '' }); }}
                 className={cn("flex-1 h-14 rounded-2xl font-black text-sm transition-all", searchMode === 'clinic' ? "bg-primary text-white shadow-lg" : "bg-stone-50 text-stone-400")}
               >بحث حسب العيادة</button>
               <button 
                 onClick={() => { setSearchMode('doctor'); setFilters({ ...filters, query: '' }); }}
                 className={cn("flex-1 h-14 rounded-2xl font-black text-sm transition-all", searchMode === 'doctor' ? "bg-primary text-white shadow-lg" : "bg-stone-50 text-stone-400")}
               >بحث حسب الطبيب</button>
            </Card>

            <Card className="p-6">
               <div className="flex flex-col md:flex-row gap-4">
                  <Input 
                    placeholder={searchMode === 'clinic' ? "ابحث عن اسم العيادة..." : "ابحث عن اسم الطبيب..."}
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    className="text-lg flex-1"
                  />
                  {searchMode === 'doctor' && (
                    <select 
                      className="select bg-stone-50 h-14 rounded-2xl font-bold border-none px-6"
                      value={filters.specialtyId}
                      onChange={(e) => setFilters({ ...filters, specialtyId: e.target.value })}
                    >
                      <option value="">جميع التخصصات</option>
                      {specialties.map(s => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
                    </select>
                  )}
                  {searchMode === 'clinic' && (
                    <select 
                      className="select bg-stone-50 h-14 rounded-2xl font-bold border-none px-6"
                      value={filters.govId}
                      onChange={(e) => setFilters({ ...filters, govId: e.target.value })}
                    >
                      <option value="">جميع المحافظات</option>
                      {governorates.map(g => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
                    </select>
                  )}
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {loading ? (
                 <p className="text-center col-span-2 py-12 opacity-30 font-bold">جاري التحميل...</p>
               ) : searchMode === 'clinic' ? (
                 filteredClinics.map(clinic => (
                   <div key={clinic.id} onClick={() => handleSelectClinic(clinic)} className="card-nhr p-8 bg-white cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-white transition-all">🏥</div>
                        <Badge variant="primary">{clinic.governorate?.nameAr}</Badge>
                      </div>
                      <h3 className="text-xl font-black text-stone-900">{clinic.name}</h3>
                      <p className="text-stone-400 font-bold mt-1 text-sm">{clinic.address}</p>
                   </div>
                 ))
               ) : (
                 filteredDoctors.map(doctor => (
                   <div key={doctor.id} onClick={() => handleSelectDoctor(doctor)} className="card-nhr p-6 bg-white cursor-pointer group flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-stone-100 flex-shrink-0 overflow-hidden border-4 border-white shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.fullName}`} alt="avatar" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-stone-900">د. {doctor.fullName}</h3>
                        <Badge variant="primary">{doctor.specialty?.nameAr}</Badge>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Step 1: Intermediate Choice (Doctor for Clinic / Clinic for Doctor) */}
        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-xl font-black text-stone-900 text-center mb-8">
              {searchMode === 'clinic' ? `الأطباء المتوفرون في ${selectedClinic?.name}` : `العيادات التي يتواجد بها د. ${selectedDoctor?.fullName}`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {loading ? (
                 <p className="text-center col-span-2 py-12 opacity-30 font-bold">جاري التحميل...</p>
               ) : searchMode === 'clinic' ? (
                 doctors.map(doctor => (
                   <div key={doctor.id} onClick={() => handleSelectDoctor(doctor)} className="card-nhr p-6 bg-white cursor-pointer flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.fullName}`} alt="avatar" /></div>
                      <div><h3 className="text-lg font-black text-stone-900">د. {doctor.fullName}</h3><p className="text-primary text-xs font-bold">{doctor.specialty?.nameAr}</p></div>
                   </div>
                 ))
               ) : (
                 clinics.map(clinic => (
                   <div key={clinic.id} onClick={() => handleFinalLocationSelection(clinic)} className="card-nhr p-8 bg-white cursor-pointer group">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">🏥</div>
                      <h3 className="text-lg font-black text-stone-900">{clinic.name}</h3>
                      <p className="text-stone-400 font-bold mt-1 text-xs">{clinic.address} — {clinic.governorate?.nameAr}</p>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Step 2: Slot Selection */}
        {step === 2 && (
          <div className="space-y-8">
            <Card className="flex flex-col md:flex-row gap-8 items-center justify-between border-2 border-primary/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-stone-100 overflow-hidden"><img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor?.fullName}`} alt="avatar" /></div>
                <div>
                  <h3 className="text-xl font-black text-stone-900">د. {selectedDoctor?.fullName}</h3>
                  <p className="text-stone-400 font-bold text-xs">يتواجد في: <span className="text-primary">{selectedClinic?.name}</span></p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map(offset => {
                  const date = addDays(new Date(), offset);
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDate === dateKey;
                  return (
                    <button key={offset} onClick={() => handleDateChange(dateKey)} className={cn("flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all border-2", isSelected ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-stone-100 text-stone-400 hover:border-primary/30")}>
                      <span className="text-[10px] font-black uppercase">{format(date, 'EEE')}</span>
                      <span className="text-xl font-black">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mr-2">المواعيد المتاحة ليوم {formatArabicDate(selectedDate)}</h3>
              <TimeSlotPicker slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} loading={loading} />
            </div>

            <div className="pt-8">
              <Button className="btn-block h-16 text-xl shadow-2xl" disabled={!selectedSlot || submitting} loading={submitting} onClick={handleConfirmBooking}>
                تأكيد حجز الموعد
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <Card className="p-16 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">✓</div>
            <h2 className="text-3xl font-black text-stone-900 mb-4">تم الحجز بنجاح!</h2>
            <p className="text-stone-500 font-bold mb-12 max-w-md mx-auto leading-relaxed">
              تم حجز موعدك مع د. {selectedDoctor?.fullName} في {selectedClinic?.name} يوم {formatArabicDate(selectedDate)} الساعة {selectedSlot?.start}.
            </p>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <Button onClick={() => navigate('/dashboard')} className="h-14">العودة للرئيسية</Button>
              <Button variant="ghost" onClick={() => setStep(0)}>حجز موعد آخر</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BookAppointment;
