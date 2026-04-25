import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function ensureClinic({ id, name, address, governorateId }) {
  let clinic = await prisma.clinic.findFirst({
    where: {
      OR: [
        { id },
        { name, address }
      ]
    }
  });

  if (clinic) {
    clinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data: { name, address, governorateId }
    });
  } else {
    clinic = await prisma.clinic.create({
      data: { id, name, address, governorateId }
    });
  }

  const duplicates = await prisma.clinic.findMany({
    where: {
      name,
      address,
      id: { not: clinic.id }
    }
  });

  for (const duplicate of duplicates) {
    await prisma.user.updateMany({ where: { clinicId: duplicate.id }, data: { clinicId: clinic.id } });
    await prisma.user.updateMany({ where: { activeClinicId: duplicate.id }, data: { activeClinicId: clinic.id } });
    await prisma.doctorSchedule.updateMany({ where: { clinicId: duplicate.id }, data: { clinicId: clinic.id } });
    await prisma.medicalEncounter.updateMany({ where: { clinicId: duplicate.id }, data: { clinicId: clinic.id } });
    await prisma.appointment.updateMany({ where: { clinicId: duplicate.id }, data: { clinicId: clinic.id } });
    await prisma.clinic.delete({ where: { id: duplicate.id } });
  }

  return clinic;
}

async function ensurePharmacy({ id, name, address }) {
  const pharmacy = await prisma.pharmacy.findFirst({
    where: {
      OR: [
        { id },
        { name, address }
      ]
    }
  });

  if (pharmacy) {
    return prisma.pharmacy.update({
      where: { id: pharmacy.id },
      data: { name, address }
    });
  }

  return prisma.pharmacy.create({
    data: { id, name, address }
  });
}

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const governorate = await prisma.governorate.upsert({
    where: { nameEn: 'Damascus' },
    update: {},
    create: {
      nameAr: 'دمشق',
      nameEn: 'Damascus',
    },
  });

  const specialty = await prisma.specialty.upsert({
    where: { nameEn: 'General Medicine' },
    update: {},
    create: {
      nameAr: 'طب عام',
      nameEn: 'General Medicine',
    },
  });

  const clinic = await ensureClinic({
    id: 'seed-clinic-damascus-central',
    name: 'Damascus Central Hospital',
    address: 'Al-Mazzeh, Damascus',
    governorateId: governorate.id,
  });

  const secondaryClinic = await ensureClinic({
    id: 'seed-clinic-al-sham-specialty',
    name: 'Al Sham Specialty Clinic',
    address: 'Kafar Souseh, Damascus',
    governorateId: governorate.id,
  });

  // 2. Create a Pharmacy
  const pharmacy = await ensurePharmacy({
    id: 'seed-pharmacy-ibn-al-nafees',
    name: 'Ibn Al-Nafees Pharmacy',
    address: 'Abu Rummaneh, Damascus',
  });

  // 3. Create Users
  const doctor = await prisma.user.upsert({
    where: { nationalId: '001001001' },
    update: {
      fullName: 'Dr. Ahmad Salim',
      password: hashedPassword,
      role: 'DOCTOR',
      clinicId: clinic.id,
      activeClinicId: clinic.id,
      specialtyId: specialty.id,
    },
    create: {
      nationalId: '001001001',
      fullName: 'Dr. Ahmad Salim',
      password: hashedPassword,
      role: 'DOCTOR',
      clinicId: clinic.id,
      activeClinicId: clinic.id,
      specialtyId: specialty.id,
    },
  });

  await prisma.doctorSchedule.deleteMany({ where: { doctorId: doctor.id } });
  await prisma.doctorSchedule.createMany({
    data: [
      {
        doctorId: doctor.id,
        clinicId: clinic.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        slotDuration: 20,
        isActive: true,
      },
      {
        doctorId: doctor.id,
        clinicId: secondaryClinic.id,
        dayOfWeek: 1,
        startTime: '13:00',
        endTime: '16:00',
        slotDuration: 20,
        isActive: true,
      }
    ]
  });

  await prisma.user.upsert({
    where: { nationalId: '002002002' },
    update: {
      fullName: 'Samer Al-Khatib',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacy.id,
    },
    create: {
      nationalId: '002002002',
      fullName: 'Samer Al-Khatib',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacy.id,
    },
  });

  const patientUser = await prisma.user.upsert({
    where: { nationalId: '123456789' },
    update: {
      fullName: 'John Doe',
      password: hashedPassword,
      role: 'PATIENT',
    },
    create: {
      nationalId: '123456789',
      fullName: 'John Doe',
      password: hashedPassword,
      role: 'PATIENT',
    },
  });

  // 4. Create Patient Profile
  await prisma.patientProfile.upsert({
    where: { nationalId: patientUser.nationalId },
    update: {
      bloodType: 'O+',
      allergies: 'Penicillin',
      chronicDiseases: 'None',
    },
    create: {
      nationalId: patientUser.nationalId,
      bloodType: 'O+',
      allergies: 'Penicillin',
      chronicDiseases: 'None',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
