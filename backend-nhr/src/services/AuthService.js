import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';
import AuditService from './AuditService.js';

class AuthService {
  static async login({ nationalId, password, prisma }) {
    const user = await prisma.user.findUnique({
      where: { nationalId },
      include: {
        clinic: true,
        pharmacy: true
      }
    });

    if (!user) {
      throw new AppError('Invalid National ID or Password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid National ID or Password', 401);
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        nationalId: user.nationalId,
        clinicId: user.clinicId,
        pharmacyId: user.pharmacyId
      },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1d' }
    );

    // Log the successful login
    await AuditService.log(prisma, {
      action: 'VIEW',
      entity: 'USER',
      entityId: user.id,
      userId: user.id,
      details: { message: 'User logged in' }
    });

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        nationalId: user.nationalId,
        clinic: user.clinic,
        pharmacy: user.pharmacy
      }
    };
  }
}

export default AuthService;
