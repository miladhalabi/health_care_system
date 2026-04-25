import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (nationalId, password) => {
    try {
      const response = await api.post('/auth/login', { nationalId, password });
      const { token, user } = response.data;
      
      // Ensure clinicId is accessible at top level for convenience
      const processedUser = {
        ...user,
        clinicId: user.clinic?.id || user.clinicId,
        pharmacyId: user.pharmacy?.id || user.pharmacyId
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(processedUser));
      
      set({ token, user: processedUser, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => {
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  }
}));

export default useAuthStore;
