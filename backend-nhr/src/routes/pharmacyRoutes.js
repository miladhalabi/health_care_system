import express from 'express';
import { getActivePrescriptions, dispenseDrugs } from '../controllers/pharmacyController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['PHARMACIST']));

router.get('/prescriptions/:nationalId', getActivePrescriptions);
router.post('/dispense', dispenseDrugs);

export default router;
