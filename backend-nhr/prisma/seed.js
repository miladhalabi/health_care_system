import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const governorateData = [
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

const specialtyData = [
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

  console.log('Cleaning up existing database data...');
  await prisma.auditLog.deleteMany({});
  await prisma.prescriptionItem.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.medicalEncounter.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorSchedule.deleteMany({});
  await prisma.doctorAbsence.deleteMany({});
  await prisma.patientProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.clinic.deleteMany({});
  await prisma.pharmacy.deleteMany({});
  await prisma.specialty.deleteMany({});
  await prisma.governorate.deleteMany({});

  console.log('Seeding Governorates...');
  const govMap = {};
  for (const gov of governorateData) {
    const createdGov = await prisma.governorate.create({
      data: gov,
    });
    govMap[gov.nameEn] = createdGov.id;
  }

  console.log('Seeding Specialties...');
  const specMap = {};
  for (const spec of specialtyData) {
    const createdSpec = await prisma.specialty.create({
      data: spec,
    });
    specMap[spec.nameEn] = createdSpec.id;
  }

  console.log('Seeding Clinics & Hospitals...');
  const clinics = [
    {
      name: 'مشفى دمشق المركزي',
      address: 'المزة، دمشق',
      governorateId: govMap['Damascus'],
    },
    {
      name: 'مركز الرازي الطبي',
      address: 'أبو رمانة، دمشق',
      governorateId: govMap['Damascus'],
    },
    {
      name: 'مستشفى الشام التخصصي',
      address: 'كفرسوسة، دمشق',
      governorateId: govMap['Damascus'],
    },
    {
      name: 'مشفى حلب الجامعي',
      address: 'الشهباء، حلب',
      governorateId: govMap['Aleppo'],
    },
    {
      name: 'مركز الشهباء الطبي',
      address: 'الفرقان، حلب',
      governorateId: govMap['Aleppo'],
    },
    {
      name: 'مشفى حمص الوطني',
      address: 'وسط المدينة، حمص',
      governorateId: govMap['Homs'],
    },
    {
      name: 'مشفى تشرين الجامعي',
      address: 'الزراعة، اللاذقية',
      governorateId: govMap['Latakia'],
    },
  ];

  const clinicMap = {};
  for (const clinic of clinics) {
    const createdClinic = await prisma.clinic.create({
      data: clinic,
    });
    clinicMap[clinic.name] = createdClinic.id;
  }

  console.log('Seeding Pharmacies...');
  const pharmacies = [
    { name: 'صيدلية ابن النفيس', address: 'ساحة السبع بحرات، دمشق' },
    { name: 'صيدلية الشفاء', address: 'شارع النيل، حلب' },
    { name: 'صيدلية الرازية', address: 'شارع الحضارة، حمص' },
    { name: 'صيدلية الأمل', address: 'شارع الكورنيش، اللاذقية' },
  ];

  const pharmacyMap = {};
  for (const pharmacy of pharmacies) {
    const createdPharmacy = await prisma.pharmacy.create({
      data: pharmacy,
    });
    pharmacyMap[pharmacy.name] = createdPharmacy.id;
  }

  console.log('Seeding Doctors...');
  const doctors = [
    {
      nationalId: '001001001',
      fullName: 'أحمد سليم',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['Cardiology'],
      clinicId: clinicMap['مشفى دمشق المركزي'],
      activeClinicId: clinicMap['مشفى دمشق المركزي'],
    },
    {
      nationalId: '001001002',
      fullName: 'ليلى مراد',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['Pediatrics'],
      clinicId: clinicMap['مشفى دمشق المركزي'],
      activeClinicId: clinicMap['مشفى دمشق المركزي'],
    },
    {
      nationalId: '001001003',
      fullName: 'مازن حرب',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['General Practice'],
      clinicId: clinicMap['مركز الرازي الطبي'],
      activeClinicId: clinicMap['مركز الرازي الطبي'],
    },
    {
      nationalId: '001001004',
      fullName: 'رنا العلي',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['Dermatology'],
      clinicId: clinicMap['مشفى حلب الجامعي'],
      activeClinicId: clinicMap['مشفى حلب الجامعي'],
    },
    {
      nationalId: '001001005',
      fullName: 'خالد الحسن',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['Orthopedics'],
      clinicId: clinicMap['مشفى حمص الوطني'],
      activeClinicId: clinicMap['مشفى حمص الوطني'],
    },
    {
      nationalId: '001001006',
      fullName: 'نور الشام',
      password: hashedPassword,
      role: 'DOCTOR',
      specialtyId: specMap['Internal Medicine'],
      clinicId: clinicMap['مشفى تشرين الجامعي'],
      activeClinicId: clinicMap['مشفى تشرين الجامعي'],
    },
  ];

  const doctorMap = {};
  for (const doc of doctors) {
    const createdDoc = await prisma.user.create({
      data: doc,
    });
    doctorMap[doc.fullName] = createdDoc.id;
  }

  console.log('Seeding Doctor Schedules (Rotation)...');
  const schedules = [
    // Dr. Ahmad Salim (Cardiology) Rotates between Damascus Central and Al Razi
    { doctorName: 'أحمد سليم', clinicName: 'مشفى دمشق المركزي', days: [0, 2, 4], start: '08:00', end: '13:00', slot: 20 },
    { doctorName: 'أحمد سليم', clinicName: 'مركز الرازي الطبي', days: [1, 3], start: '14:00', end: '18:00', slot: 15 },

    // Dr. Layla Mourad (Pediatrics) Rotates between Damascus Central and Al Sham Specialty
    { doctorName: 'ليلى مراد', clinicName: 'مشفى دمشق المركزي', days: [1, 3], start: '09:00', end: '14:00', slot: 20 },
    { doctorName: 'ليلى مراد', clinicName: 'مستشفى الشام التخصصي', days: [0, 2], start: '15:00', end: '19:00', slot: 20 },

    // Dr. Mazen Harb (General Practice) available daily at Al Razi and Damascus Central (all 7 days for easy testing)
    { doctorName: 'مازن حرب', clinicName: 'مركز الرازي الطبي', days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '12:00', slot: 15 },
    { doctorName: 'مازن حرب', clinicName: 'مشفى دمشق المركزي', days: [0, 1, 2, 3, 4, 5, 6], start: '13:00', end: '17:00', slot: 15 },

    // Dr. Rana Al-Ali (Dermatology) Rotates in Aleppo
    { doctorName: 'رنا العلي', clinicName: 'مشفى حلب الجامعي', days: [1, 3], start: '09:00', end: '13:00', slot: 20 },
    { doctorName: 'رنا العلي', clinicName: 'مركز الشهباء الطبي', days: [2, 4], start: '14:00', end: '18:00', slot: 20 },

    // Dr. Khaled الحسن (Orthopedics) in Homs
    { doctorName: 'خالد الحسن', clinicName: 'مشفى حمص الوطني', days: [0, 2, 4], start: '10:00', end: '15:00', slot: 30 },

    // Dr. Nour Al-Sham (Internal Medicine) in Latakia
    { doctorName: 'نور الشام', clinicName: 'مشفى تشرين الجامعي', days: [0, 1, 2, 3], start: '09:00', end: '14:00', slot: 20 },
  ];

  for (const sched of schedules) {
    const doctorId = doctorMap[sched.doctorName];
    const clinicId = clinicMap[sched.clinicName];
    for (const day of sched.days) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId,
          clinicId,
          dayOfWeek: day,
          startTime: sched.start,
          endTime: sched.end,
          slotDuration: sched.slot,
          isActive: true,
        },
      });
    }
  }

  console.log('Seeding Receptionists...');
  const receptionists = [
    {
      nationalId: '111111111',
      fullName: 'مروة المستقبل',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      clinicId: clinicMap['مشفى دمشق المركزي'],
    },
    {
      nationalId: '111111112',
      fullName: 'فادي الحكيم',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      clinicId: clinicMap['مركز الرازي الطبي'],
    },
    {
      nationalId: '111111113',
      fullName: 'سارة الحلبي',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      clinicId: clinicMap['مشفى حلب الجامعي'],
    },
    {
      nationalId: '111111114',
      fullName: 'بشار الحمصي',
      password: hashedPassword,
      role: 'RECEPTIONIST',
      clinicId: clinicMap['مشفى حمص الوطني'],
    },
  ];

  for (const recep of receptionists) {
    await prisma.user.create({
      data: recep,
    });
  }

  console.log('Seeding Pharmacists...');
  const pharmacists = [
    {
      nationalId: '002002002',
      fullName: 'سامر الصيدلاني',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacyMap['صيدلية ابن النفيس'],
    },
    {
      nationalId: '002002003',
      fullName: 'هالة الدواء',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacyMap['صيدلية الشفاء'],
    },
    {
      nationalId: '002002004',
      fullName: 'عمار الكيميائي',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacyMap['صيدلية الرازية'],
    },
    {
      nationalId: '002002005',
      fullName: 'منى العلاج',
      password: hashedPassword,
      role: 'PHARMACIST',
      pharmacyId: pharmacyMap['صيدلية الأمل'],
    },
  ];

  for (const pharm of pharmacists) {
    await prisma.user.create({
      data: pharm,
    });
  }

  console.log('Seeding Patients and Profiles...');
  const patients = [
    {
      nationalId: '123456789',
      fullName: 'يحيى مروان',
      password: hashedPassword,
      role: 'PATIENT',
      profile: {
        bloodType: 'O+',
        allergies: 'بنسلين',
        chronicDiseases: 'لا يوجد',
        address: 'الميدان، دمشق',
        phone: '0933111222',
        emergencyContact: 'أحمد مروان - 0944111222',
      },
    },
    {
      nationalId: '987654321',
      fullName: 'فاطمة الزهراء',
      password: hashedPassword,
      role: 'PATIENT',
      profile: {
        bloodType: 'A+',
        allergies: 'لا يوجد',
        chronicDiseases: 'السكري',
        address: 'الجميلية، حلب',
        phone: '0933444555',
        emergencyContact: 'محمد الزهراء - 0944444555',
      },
    },
    {
      nationalId: '111222333',
      fullName: 'محمد العلي',
      password: hashedPassword,
      role: 'PATIENT',
      profile: {
        bloodType: 'B-',
        allergies: 'الأسبرين',
        chronicDiseases: 'ارتفاع ضغط الدم',
        address: 'الوعر، حمص',
        phone: '0933777888',
        emergencyContact: 'علي العلي - 0944777888',
      },
    },
    {
      nationalId: '444555666',
      fullName: 'ريم السعدي',
      password: hashedPassword,
      role: 'PATIENT',
      profile: {
        bloodType: 'O-',
        allergies: 'المكسرات',
        chronicDiseases: 'الربو',
        address: 'المشروع الأول، اللاذقية',
        phone: '0933999000',
        emergencyContact: 'خالد السعدي - 0944999000',
      },
    },
    {
      nationalId: '777888999',
      fullName: 'طارق اليوسف',
      password: hashedPassword,
      role: 'PATIENT',
      profile: {
        bloodType: 'AB+',
        allergies: 'لا يوجد',
        chronicDiseases: 'لا يوجد',
        address: 'الشهباء، حلب',
        phone: '0933222333',
        emergencyContact: 'سحر اليوسف - 0944222333',
      },
    },
  ];

  for (const pat of patients) {
    const createdUser = await prisma.user.create({
      data: {
        nationalId: pat.nationalId,
        fullName: pat.fullName,
        password: pat.password,
        role: pat.role,
      },
    });

    await prisma.patientProfile.create({
      data: {
        nationalId: createdUser.nationalId,
        ...pat.profile,
      },
    });
  }

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
