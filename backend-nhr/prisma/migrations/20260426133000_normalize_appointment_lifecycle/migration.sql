-- Normalize appointment lifecycle to use explicit booked and attended statuses.
UPDATE "Appointment"
SET "status" = 'BOOKED'
WHERE "bookingType" = 'SCHEDULED'
  AND "status" = 'WAITING'
  AND COALESCE("isConfirmed", false) = false;

UPDATE "Appointment"
SET "status" = 'ATTENDED'
WHERE "status" = 'DONE';
