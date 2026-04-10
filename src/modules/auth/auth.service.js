import { Injectable, Dependencies, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
@Dependencies(PrismaService, JwtService)
export class AuthService {
  constructor(prisma, jwtService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
  }

  async register(userData) {
    const existingUser = await this.prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (existingUser) {
      throw new ConflictException({
        error: 'Conflict',
        message: 'Username already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    return this.prisma.user.create({
      data: {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
        clinicId: userData.clinicId,
      },
      select: {
        id: true,
        username: true,
        role: true,
        name: true,
        clinicId: true,
      },
    });
  }

  async login(username, password) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }

    const payload = { 
      userId: user.id,
      username: user.username, 
      role: user.role, 
      clinicId: user.clinicId 
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
