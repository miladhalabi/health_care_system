import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { Badge, Skeleton, formatArabicDate } from '@nhr/shared';

const Encounters = () => {
  const { user } = useAuthStore();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use activeClinicId for Doctors, clinicId for Receptionists
  const currentClinicId = user?.role === 'RECEPTIONIST' ? user.clinicId : user?.activeClinicId;

  useEffect(() => {
    const fetchEncounters = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/clinic/encounters/${currentClinicId}`);
        setEncounters(response.data);
      } catch (err) {
        console.error('Error fetching encounters:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentClinicId) {
      fetchEncounters();
    } else {
      setLoading(false);
    }
  }, [currentClinicId]);

  return (
    <Layout>
      {!currentClinicId ? (
        <div className="card-nhr p-20 text-center flex flex-col items-center">
           <div className="text-5xl mb-6">📂</div>
           <h3 className="text-xl font-bold text-content mb-4">الرجاء تحديد مقر العمل الحالي</h3>
           <p className="text-content-muted font-bold max-w-md">
             يجب عليك اختيار العيادة من القائمة في الأعلى لعرض سجل المعاينات الخاص بها.
           </p>
        </div>
      ) : (
        <div className="card-nhr p-0 overflow-hidden">
          <div className="p-8 border-b border-border-main flex justify-between items-center bg-surface-bg/30">
             <div>
                <h2 className="text-2xl font-bold text-content leading-tight">سجل المعاينات المنفذة</h2>
                <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest mt-1">تاريخ المراجعات في هذا المركز</p>
             </div>
             <span className="badge-nhr bg-primary text-content-inverse h-10 px-6">{encounters.length} معاينة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-surface-bg/20 text-content-muted text-[10px] uppercase tracking-widest border-b border-border-main">
                  <th className="text-right py-6 pr-8">التاريخ</th>
                  <th className="text-right py-6">المراجع</th>
                  <th className="text-right py-6">التشخيص</th>
                  <th className="text-right py-6">الطبيب المعالج</th>
                  <th className="text-right py-6 pl-8">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center">
                      <Skeleton className="h-12 w-full mb-4" />
                      <Skeleton className="h-12 w-full mb-4" />
                      <Skeleton className="h-12 w-full" />
                    </td>
                  </tr>
                ) : encounters.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-24">
                       <div className="text-4xl mb-4 opacity-10">📄</div>
                       <p className="font-bold text-content-subtle uppercase tracking-widest">لا توجد معاينات مسجلة في هذا المركز حتى الآن</p>
                    </td>
                  </tr>
                ) : (
                  encounters.map((visit) => (
                    <tr key={visit.id} className="hover:bg-surface-bg/50 transition-colors group">
                      <td className="pr-8 py-6">
                         <span className="font-bold text-content">{formatArabicDate(visit.date)}</span>
                      </td>
                      <td>
                         <div className="font-bold text-content">{visit.patient.user.fullName}</div>
                         <div className="text-[10px] font-bold text-content-muted uppercase tracking-widest">{visit.patient.nationalId}</div>
                      </td>
                      <td>
                         <span className="badge-nhr bg-surface-bg text-content-muted">{visit.diagnosis}</span>
                      </td>
                      <td>
                         <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-bg flex items-center justify-center text-[10px] font-bold text-content-muted border border-border-main">Dr</div>
                            <span className="text-xs font-bold text-content-muted">د. {visit.doctor.fullName}</span>
                         </div>
                      </td>
                      <td className="pl-8">
                         <button className="btn-nhr h-8 text-xs font-bold px-4 bg-surface-bg hover:bg-primary/10 hover:text-primary transition-all">تفاصيل</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Encounters;
