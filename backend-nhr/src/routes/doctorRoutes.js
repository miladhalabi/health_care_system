import express from 'express';
import { 
  getDoctorConfig, 
  switchActiveSession, 
  upsertSchedule, 
  deleteSchedule 
} from '../controllers/doctorController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['DOCTOR']));

router.get('/config', getDoctorConfig);
router.patch('/active-session', switchActiveSession);
router.post('/schedules', upsertSchedule);
router.delete('/schedules/:id', deleteSchedule);

export default router;
