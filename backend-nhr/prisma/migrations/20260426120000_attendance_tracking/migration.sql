-- Add new appointment lifecycle states for scheduled booking and attendance tracking
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'BOOKED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'ATTENDED';
ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'NO_SHOW';
