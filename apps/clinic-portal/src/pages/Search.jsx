import { useState } from 'react';
import Layout from '../components/Layout';
import PatientHistory from '../components/PatientHistory';
import api from '../api/axios';

const Search = () => {
  const [nationalId, setNationalId] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPatient(null);
    try {
      const response = await api.get(`/clinic/patient/${nationalId}`);
      setPatient(response.data);
    } catch (err) {
      setError('المراجع غير موجود في السجل الوطني');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="card p-10 bg-white mb-12">
          <h2 className="text-2xl font-black text-stone-900 mb-2">البحث في السجل الوطني</h2>
          <p className="text-sm font-bold text-stone-400 mb-8 uppercase tracking-widest">عرض التاريخ الطبي الكامل للمراجع</p>
          
          <form onSubmit={handleSearch} className="join w-full">
            <input 
              type="text" 
              placeholder="أدخل الرقم الوطني للمراجع..." 
              className="input input-bordered join-item w-full bg-stone-50 text-center text-xl font-black tracking-widest h-16" 
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              required
            />
            <button className={`btn btn-primary join-item h-16 px-10 text-lg ${loading ? 'loading' : ''}`}>
              بحث
            </button>
          </form>
          {error && <p className="text-error text-center mt-4 font-bold">{error}</p>}
        </div>

        {patient && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="card p-10 bg-white mb-8 border-r-4 border-primary">
               <div className="flex items-center gap-6">
                  <div className="avatar">
                    <div className="w-20 rounded-2xl ring ring-primary/10 ring-offset-2">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.user.fullName}`} alt="patient" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-stone-900">{patient.user.fullName}</h3>
                    <div className="flex gap-4 mt-2">
                       <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">الرقم الوطني: {patient.nationalId}</span>
                       <span className="badge badge-primary badge-outline font-bold">زمرة الدم: {patient.bloodType || '--'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="card p-10 bg-white shadow-xl">
               <h3 className="text-xl font-black text-stone-900 mb-8 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  التاريخ الطبي الكامل
               </h3>
               <PatientHistory history={patient.encounters} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
