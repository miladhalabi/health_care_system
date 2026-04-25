import express from 'express';
import { 
  getQueue, 
  addToQueue, 
  getPatientHistory, 
  createEncounter, 
  callPatient, 
  getClinicEncounters,
  getClinicDoctors,
  getDoctorAvailability,
  getClinicAppointments,
  checkInPatient
} from '../controllers/clinicController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Queue management
router.get('/queue/:clinicId', authorize(['DOCTOR', 'RECEPTIONIST']), getQueue);
router.post('/queue', authorize(['RECEPTIONIST']), addToQueue);
router.patch('/queue/call/:appointmentId', authorize(['DOCTOR']), callPatient);
router.patch('/queue/check-in/:appointmentId', authorize(['RECEPTIONIST', 'DOCTOR']), checkInPatient);

// Patient records
router.get('/patient/:nationalId', authorize(['DOCTOR']), getPatientHistory);

// Encounter management
router.get('/encounters/:clinicId', authorize(['DOCTOR']), getClinicEncounters);
router.post('/encounter', authorize(['DOCTOR']), createEncounter);

// Scheduling
router.get('/doctors/:clinicId', authorize(['DOCTOR', 'RECEPTIONIST', 'PATIENT']), getClinicDoctors);
router.get('/availability/:doctorId', authorize(['DOCTOR', 'RECEPTIONIST', 'PATIENT']), getDoctorAvailability);
router.get('/appointments/:clinicId', authorize(['DOCTOR', 'RECEPTIONIST']), getClinicAppointments);

export default router;
