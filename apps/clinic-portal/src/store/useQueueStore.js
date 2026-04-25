import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../api/axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useQueueStore = create((set, get) => ({
  queue: [],
  socket: null,
  loading: false,
  activeRoom: null,

  initSocket: (clinicId) => {
    if (!clinicId) return;
    
    let socket = get().socket;
    
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Socket Connected:', socket.id);
        socket.emit('join_clinic_queue', clinicId);
        set({ activeRoom: clinicId });
      });

      socket.on('queue_updated', () => {
        console.log('Queue update received via socket');
        // We use the room stored in the closure or current activeRoom
        const room = get().activeRoom;
        if (room) get().fetchQueue(room);
      });

      set({ socket });
    } else {
      // Socket already exists, check if we need to switch rooms
      if (get().activeRoom !== clinicId) {
        socket.emit('join_clinic_queue', clinicId);
        set({ activeRoom: clinicId });
        get().fetchQueue(clinicId);
      }
    }
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, activeRoom: null });
    }
  },

  fetchQueue: async (clinicId) => {
    if (!clinicId) return;
    set({ loading: true });
    try {
      const response = await api.get(`/clinic/queue/${clinicId}`);
      set({ queue: response.data, loading: false });
    } catch (error) {
      console.error('Error fetching queue:', error);
      set({ loading: false });
    }
  },

  addToQueue: async (clinicId, nationalId) => {
    try {
      await api.post('/clinic/queue', { clinicId, nationalId });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'خطأ في الإضافة' 
      };
    }
  },

  callPatient: async (appointmentId) => {
    try {
      await api.patch(`/clinic/queue/call/${appointmentId}`);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'خطأ في مناداة المريض' };
    }
  }
}));

export default useQueueStore;
