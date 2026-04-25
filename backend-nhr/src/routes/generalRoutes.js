import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Publicly available metadata (still require authentication for system security)
router.use(authenticate);

router.get('/governorates', async (req, res) => {
  const govs = await prisma.governorate.findMany({ orderBy: { nameAr: 'asc' } });
  res.json(govs);
});

router.get('/specialties', async (req, res) => {
  const specs = await prisma.specialty.findMany({ orderBy: { nameAr: 'asc' } });
  res.json(specs);
});

router.get('/clinics', async (req, res) => {
  const clinics = await prisma.clinic.findMany({
    include: { governorate: true },
    orderBy: { name: 'asc' }
  });
  res.json(clinics);
});

export default router;
