import express from 'express';
import { 
  getMyRecords, 
  getClinics, 
  joinQueue, 
  bookAppointment, 
  getMyAppointments,
  getDoctors,
  getDoctorClinics
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['PATIENT']));

router.get('/records', getMyRecords);
router.get('/clinics', getClinics);
router.get('/doctors', getDoctors);
router.get('/doctors/:doctorId/clinics', getDoctorClinics);
router.post('/join-queue', joinQueue);

// Scheduling
router.post('/book', bookAppointment);
router.get('/appointments', getMyAppointments);

export default router;
