import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ToastContainer from './ToastContainer';
import { PortalLayout } from '@nhr/shared';
import api from '../api/axios';

const Layout = ({ children }) => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [availableClinics, setAvailableClinics] = useState([]);

  useEffect(() => {
    let isMounted = true;
    if (user?.role === 'DOCTOR' && !activeSession) {
      fetchSessionData();
    }
    return () => { isMounted = false; };
  }, [user?.id]);

  const fetchSessionData = async () => {
    try {
      const res = await api.get('/doctor/config');
      setActiveSession(res.data.activeClinic);
      
      if (res.data.activeClinic?.id !== user.activeClinicId) {
        updateUser({ activeClinicId: res.data.activeClinic?.id });
      }
      
      const clinics = Array.from(new Map(res.data.rotation.map(r => [r.clinic.id, r.clinic])).values());
      setAvailableClinics(clinics);

      if (!res.data.activeClinic && res.data.suggestedClinicId) {
        const suggested = clinics.find(c => c.id === res.data.suggestedClinicId);
        if (suggested && window.confirm(`يبدو أنك في ${suggested.name} الآن. هل تود تفعيل الجلسة؟`)) {
          handleSwitchSession(suggested.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchSession = async (clinicId) => {
    try {
      const res = await api.patch('/doctor/active-session', { clinicId });
      setActiveSession(res.data.activeClinic);
      updateUser({ activeClinicId: clinicId });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'الرئيسية', path: '/dashboard', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'جدول المواعيد', path: '/schedule', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'سجل المرضى', path: '/search', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
    ), roles: ['DOCTOR', 'RECEPTIONIST'] },
    { label: 'جدول المناوبات', path: '/rotation', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/><path d="M12 7v8"/></svg>
    ), roles: ['DOCTOR'] },
    { label: 'المعاينات', path: '/encounters', icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
    ), roles: ['DOCTOR'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role));

  const headerActions = user?.role === 'DOCTOR' && (
    <div className="flex flex-col ml-4">
       <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">المقر الحالي</p>
       <select 
         className="select select-sm select-bordered h-9 min-h-0 bg-white border-zinc-200 rounded-lg font-bold text-[11px] px-3 focus:ring-primary/10"
         value={activeSession?.id || ''}
         onChange={(e) => handleSwitchSession(e.target.value)}
       >
         <option value="">غير متصل بالخدمة</option>
         {availableClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
       </select>
    </div>
  );

  return (
    <>
      <ToastContainer />
      <PortalLayout
        user={user}
        navItems={filteredNavItems}
        onLogout={handleLogout}
        portalName="بوابة العيادة والمركز الطبي"
        logo="N"
        brandName={user?.clinic?.name || 'مركز العناية الطبية'}
        headerActions={headerActions}
      >
        {children}
      </PortalLayout>
    </>
  );
};

export default Layout;
