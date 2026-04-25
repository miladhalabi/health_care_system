const PatientHistory = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-10 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-200">
        <p className="text-stone-400 font-bold">لا يوجد سجل طبي سابق لهذا المراجع</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((visit, index) => (
        <div key={visit.id} className="relative pr-8 border-r-2 border-stone-100 pb-6 last:pb-0">
          <div className="absolute right-[-9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white"></div>
          
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{new Date(visit.date).toLocaleDateString('ar-SY')}</span>
              <h4 className="text-lg font-black text-stone-900 mt-1">{visit.diagnosis}</h4>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{visit.clinic.name}</p>
              <p className="text-xs font-bold text-stone-600">د. {visit.doctor.fullName}</p>
            </div>
          </div>
          
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">الأعراض</span>
                   <p className="text-xs font-medium text-stone-600 mt-1">{visit.symptoms}</p>
                </div>
                {visit.prescription && (
                  <div>
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">الوصفة الطبية</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                       {visit.prescription.items.map((item, i) => (
                         <span key={i} className="badge badge-sm badge-outline text-[9px] font-bold">{item.drugName}</span>
                       ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PatientHistory;
