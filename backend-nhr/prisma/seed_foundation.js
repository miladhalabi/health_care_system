import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const governorates = [
  { nameAr: 'دمشق', nameEn: 'Damascus' },
  { nameAr: 'ريف دمشق', nameEn: 'Rif Dimashq' },
  { nameAr: 'حلب', nameEn: 'Aleppo' },
  { nameAr: 'حمص', nameEn: 'Homs' },
  { nameAr: 'حماة', nameEn: 'Hama' },
  { nameAr: 'اللاذقية', nameEn: 'Latakia' },
  { nameAr: 'طرطوس', nameEn: 'Tartus' },
  { nameAr: 'إدلب', nameEn: 'Idlib' },
  { nameAr: 'الحسكة', nameEn: 'Al-Hasakah' },
  { nameAr: 'دير الزور', nameEn: 'Deir ez-Zor' },
  { nameAr: 'الرقة', nameEn: 'Raqqa' },
  { nameAr: 'درعا', nameEn: 'Daraa' },
  { nameAr: 'السويداء', nameEn: 'As-Suwayda' },
  { nameAr: 'القنيطرة', nameEn: 'Quneitra' },
];

const specialties = [
  { nameAr: 'طب عام', nameEn: 'General Practice' },
  { nameAr: 'أمراض القلب', nameEn: 'Cardiology' },
  { nameAr: 'طب الأطفال', nameEn: 'Pediatrics' },
  { nameAr: 'الأمراض الجلدية', nameEn: 'Dermatology' },
  { nameAr: 'جراحة العظام', nameEn: 'Orthopedics' },
  { nameAr: 'طب العيون', nameEn: 'Ophthalmology' },
  { nameAr: 'طب الأعصاب', nameEn: 'Neurology' },
  { nameAr: 'الأمراض البولية', nameEn: 'Urology' },
  { nameAr: 'الأورام', nameEn: 'Oncology' },
  { nameAr: 'النسائية والتوليد', nameEn: 'Gynecology' },
  { nameAr: 'الطب النفسي', nameEn: 'Psychiatry' },
  { nameAr: 'أذن أنف حنجرة', nameEn: 'ENT' },
  { nameAr: 'الأشعة', nameEn: 'Radiology' },
  { nameAr: 'الجراحة العامة', nameEn: 'General Surgery' },
  { nameAr: 'الطب الداخلي', nameEn: 'Internal Medicine' },
];

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('Seeding Governorates...');
  for (const gov of governorates) {
    await prisma.governorate.upsert({
      where: { nameEn: gov.nameEn },
      update: {},
      create: gov,
    });
  }

  console.log('Seeding Specialties...');
  for (const spec of specialties) {
    await prisma.specialty.upsert({
      where: { nameEn: spec.nameEn },
      update: {},
      create: spec,
    });
  }

  const cardiology = await prisma.specialty.findUnique({ where: { nameEn: 'Cardiology' } });
  const damascus = await prisma.governorate.findUnique({ where: { nameEn: 'Damascus' } });

  console.log('Creating Clinics...');
  const hospitalA = await prisma.clinic.create({
    data: {
      name: 'مشفى دمشق المركزي',
      address: 'المزة، دمشق',
      governorateId: damascus.id
    }
  });

  const centerB = await prisma.clinic.create({
    data: {
      name: 'مركز الرازي الطبي',
      address: 'أبو رمانة، دمشق',
      governorateId: damascus.id
    }
  });

  console.log('Creating Independent Doctor...');
  const doctor = await prisma.user.create({
    data: {
      nationalId: '001001001',
      fullName: 'د. أحمد سليم',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: cardiology.id
    }
  });

  console.log('Creating Receptionists (Linked to Clinics)...');
  await prisma.user.create({
    data: {
      nationalId: '111111111',
      fullName: 'مروة المستقبل',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      clinicId: hospitalA.id
    }
  });

  console.log('Creating Pharmacy and Pharmacist...');
  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: 'صيدلية ابن النفيس',
      address: 'ساحة السبع بحرات، دمشق'
    }
  });

  await prisma.user.create({
    data: {
      nationalId: '002002002',
      fullName: 'سامر الصيدلاني',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacy.id
    }
  });

  console.log('Setting up Multi-Clinic Rotation for Doctor Salim...');
  for (let day = 0; day <= 6; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        clinicId: hospitalA.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '12:00',
        slotDuration: 15
      }
    });

    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        clinicId: centerB.id,
        dayOfWeek: day,
        startTime: '13:00',
        endTime: '22:00', // Extended for testing
        slotDuration: 30
      }
    });
  }

  console.log('Creating Test Patient...');
  const patientUser = await prisma.user.create({
    data: {
      nationalId: '123456789',
      fullName: 'يحيى مروان',
      password: hashedPassword,
      role: 'PATIENT',
    }
  });

  await prisma.patientProfile.create({
    data: {
      nationalId: patientUser.nationalId,
      bloodType: 'O+',
      allergies: 'بنسلين',
      chronicDiseases: 'لا يوجد',
    }
  });

  console.log('Foundation and Rotation seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
