import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { UsersService } from '../users/users.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(dto: SignupDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      partyId: dto.partyId,
      isActive: true,
    });

    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      partyId: user.partyId,
      isActive: user.isActive,
    });
  }

  async signin(dto: SigninDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      partyId: user.partyId,
      isActive: user.isActive,
    });
  }

  async me(user: AuthenticatedUser) {
    return {
      user,
    };
  }

  private async buildAuthResponse(user: AuthenticatedUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      partyId: user.partyId,
    };

    const expiresIn = Number(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') || '86400',
    );

    if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new Error('JWT_EXPIRES_IN_SECONDS must be a positive number');
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn,
    });

    return {
      accessToken,
      user,
    };
  }
}
