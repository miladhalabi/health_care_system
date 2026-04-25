import { useState } from 'react';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import useToastStore from '../store/useToastStore';
import api from '../api/axios';

const Dashboard = () => {
  const { addToast } = useToastStore();
  const [nationalId, setNationalId] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [dispensing, setDispensing] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!nationalId.trim()) return;
    
    setSearching(true);
    setSearched(false);
    setPrescriptions([]);
    setSelectedItems([]);
    setPatientName('');

    try {
      const response = await api.get(`/pharmacy/prescriptions/${nationalId.trim()}`);
      setPrescriptions(response.data);
      setSearched(true);

      // Extract patient name from first prescription's encounter
      if (response.data.length > 0 && response.data[0].encounter) {
        // Patient name comes from the encounter's patient profile -> user
        setPatientName(response.data[0].encounter.doctor?.fullName ? '' : '');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        addToast('لم يتم العثور على مريض بهذا الرقم الوطني', 'error');
      } else {
        addToast('خطأ في البحث عن الوصفات', 'error');
      }
      setSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const toggleItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllInPrescription = (prescription) => {
    const itemIds = prescription.items.map((i) => i.id);
    const allSelected = itemIds.every((id) => selectedItems.includes(id));

    if (allSelected) {
      setSelectedItems((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedItems((prev) => [...new Set([...prev, ...itemIds])]);
    }
  };

  const handleDispense = async () => {
    if (selectedItems.length === 0) {
      addToast('الرجاء اختيار أدوية للصرف', 'error');
      return;
    }

    setDispensing(true);
    try {
      await api.post('/pharmacy/dispense', { itemIds: selectedItems });
      addToast(`تم صرف ${selectedItems.length} أدوية بنجاح`);
      setSelectedItems([]);

      // Refresh prescriptions
      const response = await api.get(`/pharmacy/prescriptions/${nationalId.trim()}`);
      setPrescriptions(response.data);
    } catch (err) {
      addToast('خطأ في عملية الصرف', 'error');
    } finally {
      setDispensing(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PENDING') return <span className="badge badge-warning badge-sm font-bold px-3 py-2.5">قيد الانتظار</span>;
    if (status === 'PARTIAL') return <span className="badge badge-info badge-sm font-bold px-3 py-2.5">صرف جزئي</span>;
    return <span className="badge badge-success badge-sm font-bold px-3 py-2.5">مكتمل</span>;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-SY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      {/* Search Section */}
      <div className="mb-10">
        <h2 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          البحث عن وصفات المريض
        </h2>

        <form onSubmit={handleSearch} className="card p-8 bg-white border border-stone-100 shadow-xl">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-black text-stone-500 uppercase tracking-widest mr-2">الرقم الوطني للمريض</label>
              <input
                type="text"
                placeholder="أدخل الرقم الوطني..."
                className="input text-center text-xl font-black tracking-widest w-full bg-stone-50"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary h-14 px-12 text-lg font-black shadow-xl shadow-teal-500/20 ${searching ? 'loading' : ''}`}
              disabled={searching}
            >
              {searching ? '' : 'بحث'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {searching && (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Results Section */}
      {!searching && searched && (
        <>
          {prescriptions.length === 0 ? (
            <div className="card p-24 bg-white border-2 border-dashed border-stone-200 text-center">
              <div className="text-7xl mb-8 opacity-20">💊</div>
              <h3 className="text-2xl font-black text-stone-300 uppercase tracking-widest">لا توجد وصفات نشطة</h3>
              <p className="text-sm text-stone-400 font-bold mt-4">جميع وصفات هذا المريض تم صرفها بالكامل، أو الرقم غير موجود</p>
            </div>
          ) : (
            <>
              {/* Dispense Action Bar */}
              {selectedItems.length > 0 && (
                <div className="sticky top-0 z-30 mb-6">
                  <div className="card p-6 bg-gradient-to-br from-primary to-teal-700 text-white border-none shadow-2xl shadow-teal-500/30 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">
                        {selectedItems.length}
                      </div>
                      <div>
                        <p className="font-black text-lg">أدوية محددة للصرف</p>
                        <p className="text-teal-100 text-xs font-bold">اضغط صرف لتأكيد العملية</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedItems([])}
                        className="btn btn-ghost text-white/70 hover:text-white font-bold"
                      >
                        إلغاء التحديد
                      </button>
                      <button
                        onClick={handleDispense}
                        className={`btn bg-white text-primary hover:bg-white/90 border-none h-14 px-10 text-lg font-black shadow-lg ${dispensing ? 'loading' : ''}`}
                        disabled={dispensing}
                      >
                        {dispensing ? '' : 'صرف الأدوية'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Prescriptions List */}
              <div className="space-y-8">
                {prescriptions.map((prescription) => {
                  const allItemIds = prescription.items.map((i) => i.id);
                  const allSelected = allItemIds.length > 0 && allItemIds.every((id) => selectedItems.includes(id));
                  const someSelected = allItemIds.some((id) => selectedItems.includes(id));

                  return (
                    <div key={prescription.id} className="card bg-white border border-stone-100 shadow-xl overflow-hidden">
                      {/* Prescription Header */}
                      <div className="p-8 border-b border-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-stone-900">
                              وصفة طبية - {formatDate(prescription.createdAt)}
                            </h3>
                            <p className="text-xs font-bold text-stone-400 mt-1">
                              {prescription.encounter?.doctor?.fullName && `الطبيب: ${prescription.encounter.doctor.fullName}`}
                              {prescription.encounter?.clinic?.name && ` — ${prescription.encounter.clinic.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {getStatusBadge(prescription.status)}
                          {prescription.items.length > 0 && (
                            <button
                              onClick={() => toggleAllInPrescription(prescription)}
                              className={`btn btn-sm font-bold rounded-xl transition-all ${
                                allSelected 
                                  ? 'btn-primary text-white' 
                                  : someSelected
                                    ? 'btn-outline btn-primary'
                                    : 'btn-ghost text-stone-400 hover:text-primary'
                              }`}
                            >
                              {allSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prescription Items */}
                      {prescription.items.length > 0 ? (
                        <div className="divide-y divide-stone-50">
                          {prescription.items.map((item) => {
                            const isSelected = selectedItems.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`p-6 flex items-center gap-6 cursor-pointer transition-all duration-200 hover:bg-stone-50 ${
                                  isSelected ? 'bg-primary/5 border-r-4 border-primary' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected 
                                    ? 'bg-primary border-primary text-white' 
                                    : 'border-stone-200 hover:border-primary'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </div>

                                {/* Drug Icon */}
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                  <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 12h3m-3 4h3" />
                                  </svg>
                                </div>

                                {/* Drug Details */}
                                <div className="flex-1">
                                  <h4 className="text-lg font-black text-stone-900">{item.drugName}</h4>
                                  <p className="text-sm font-bold text-stone-400 mt-1">{item.dosage}</p>
                                </div>

                                {/* Quantity */}
                                <div className="text-center px-4">
                                  <span className="text-[9px] font-black text-stone-400 uppercase block tracking-widest">الكمية</span>
                                  <span className="text-2xl font-black text-stone-900">{item.quantity}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-stone-400 font-bold text-sm">جميع أدوية هذه الوصفة تم صرفها</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Initial State */}
      {!searching && !searched && (
        <div className="card p-24 bg-white border-2 border-dashed border-stone-200 text-center">
          <div className="text-7xl mb-8 opacity-20">🔍</div>
          <h3 className="text-2xl font-black text-stone-300 uppercase tracking-widest">ابحث عن مريض للبدء</h3>
          <p className="text-sm text-stone-400 font-bold mt-4">أدخل الرقم الوطني للمريض للاطلاع على وصفاته النشطة</p>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
