import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Create a demo user',
    description:
      'Creates a user and returns a JWT access token. For production, public signup should not allow privileged roles.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User email or Daml party already exists',
  })
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates a user and returns a JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns the user linked to the provided JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid JWT token',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }
}
