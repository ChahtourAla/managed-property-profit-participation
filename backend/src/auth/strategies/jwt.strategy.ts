import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../../common/enums/user-role.enum';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  partyId?: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is missing in .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findActiveById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid token user');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as UserRole,
      partyId: user.partyId,
      isActive: user.isActive,
    };
  }
}
