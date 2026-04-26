import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import ToastContainer from './ToastContainer';
import { PortalLayout } from '@nhr/shared';

const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { 
      label: 'صرف الأدوية', 
      path: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
          <path d="M12 8v8" />
          <path d="M8 12h8" />
        </svg>
      )
    },
  ];

  return (
    <>
      <ToastContainer />
      <PortalLayout
        user={user}
        navItems={navItems}
        onLogout={handleLogout}
        portalName="بوابة الصيدلية"
        logo="Rx"
        brandName={user?.pharmacy?.name || 'الصيدلية العامة'}
      >
        {children}
      </PortalLayout>
    </>
  );
};

export default Layout;
