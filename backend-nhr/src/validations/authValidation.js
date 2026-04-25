import { z } from 'zod';

export const loginSchema = z.object({
  nationalId: z.string().min(9, 'الرقم الوطني يجب أن يكون 9 أرقام على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export const registerPatientSchema = z.object({
  nationalId: z.string().min(9),
  fullName: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().optional(),
});
