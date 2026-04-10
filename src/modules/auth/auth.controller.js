import { Controller, Post, Body, Dependencies, Bind } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
@Dependencies(AuthService)
export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @Bind(Body())
  async register(userData) {
    return this.authService.register(userData);
  }

  @Post('login')
  @Bind(Body())
  async login(loginData) {
    return this.authService.login(loginData.username, loginData.password);
  }
}
