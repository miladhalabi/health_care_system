import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
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
      label: 'الرئيسية', 
      path: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      )
    },
    { 
      label: 'حجز موعد', 
      path: '/book', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    },
  ];

  return (
    <PortalLayout
      user={user}
      navItems={navItems}
      onLogout={handleLogout}
      portalName="بوابة المواطن"
      logo="P"
      brandName="السجل الصحي الوطني"
    >
      {children}
    </PortalLayout>
  );
};

export default Layout;
