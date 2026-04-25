import AppError from '../utils/AppError.js';
import AuditService from '../services/AuditService.js';

/**
 * Get active prescriptions for a patient (PENDING or PARTIAL status)
 */
export const getActivePrescriptions = async (req, res, next) => {
  const { nationalId } = req.params;
  const prisma = req.app.get('prisma');

  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { nationalId },
      include: {
        user: { select: { fullName: true } },
        prescriptions: {
          where: {
            status: { in: ['PENDING', 'PARTIAL'] }
          },
          include: {
            items: {
              where: { status: 'PENDING' }
            },
            encounter: {
              include: { 
                doctor: { select: { fullName: true } }, 
                clinic: { select: { name: true } } 
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!patient) throw new AppError('المواطن غير موجود في السجل الوطني', 404);
    
    res.json(patient.prescriptions);
  } catch (error) {
    next(error);
  }
};

/**
 * Dispense selected drugs and update prescription status
 */
export const dispenseDrugs = async (req, res, next) => {
  const { itemIds } = req.body;
  const prisma = req.app.get('prisma');
  const pharmacyId = req.user.pharmacyId;

  if (!pharmacyId) throw new AppError('المستخدم غير مرتبط بصيدلية مفعلة', 403);
  if (!itemIds || itemIds.length === 0) throw new AppError('لم يتم اختيار أدوية للصرف', 400);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark items as dispensed
      await tx.prescriptionItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: 'DISPENSED',
          pharmacyId,
          dispensedAt: new Date()
        }
      });

      // 2. Identify all affected prescriptions
      const updatedItems = await tx.prescriptionItem.findMany({
        where: { id: { in: itemIds } },
        select: { prescriptionId: true }
      });

      const prescriptionIds = [...new Set(updatedItems.map(i => i.prescriptionId))];

      // 3. Update status for each affected prescription
      for (const pId of prescriptionIds) {
        const remaining = await tx.prescriptionItem.count({
          where: { prescriptionId: pId, status: 'PENDING' }
        });

        await tx.prescription.update({
          where: { id: pId },
          data: {
            status: remaining === 0 ? 'COMPLETED' : 'PARTIAL'
          }
        });
      }

      // 4. Audit Log
      await AuditService.log(tx, {
        action: 'UPDATE',
        entity: 'PRESCRIPTION_ITEM',
        entityId: itemIds.join(','),
        userId: req.user.id,
        details: { 
          message: `Dispensed ${itemIds.length} items`,
          pharmacyId,
          prescriptionIds
        }
      });

      return { success: true, count: itemIds.length };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
