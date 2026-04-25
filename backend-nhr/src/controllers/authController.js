import AuthService from '../services/AuthService.js';
import { loginSchema } from '../validations/authValidation.js';

export const login = async (req, res, next) => {
  try {
    // 1. Validation
    const validatedData = loginSchema.parse(req.body);
    
    const prisma = req.app.get('prisma');
    
    // 2. Logic via Service
    const result = await AuthService.login({
      ...validatedData,
      prisma
    });

    res.json(result);
  } catch (error) {
    next(error); // Passes to global error handler
  }
};

export const getMe = async (req, res, next) => {
  const prisma = req.app.get('prisma');
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        clinic: true,
        pharmacy: true
      }
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};
