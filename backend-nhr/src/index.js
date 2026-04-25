import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

import logger from './utils/logger.js';
import errorMiddleware from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || "*"
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // Increased to 1000 for dashboard interactivity
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json());

// Make prisma and io accessible in routes
app.set('prisma', prisma);
app.set('io', io);

// Routes
import generalRoutes from './routes/generalRoutes.js';
app.use('/api/general', generalRoutes);

import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

import clinicRoutes from './routes/clinicRoutes.js';
app.use('/api/clinic', clinicRoutes);

import pharmacyRoutes from './routes/pharmacyRoutes.js';
app.use('/api/pharmacy', pharmacyRoutes);

import patientRoutes from './routes/patientRoutes.js';
app.use('/api/patient', patientRoutes);

import doctorRoutes from './routes/doctorRoutes.js';
app.use('/api/doctor', doctorRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('NHR Backend is running...');
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_clinic_queue', (clinicId) => {
    socket.join(`clinic_${clinicId}`);
    logger.info(`User ${socket.id} joined clinic queue: ${clinicId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Global Error Handler (Must be last)
app.use(errorMiddleware);

httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
