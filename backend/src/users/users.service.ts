import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLowerCase(),
      },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    if (dto.partyId) {
      const existingPartyUser = await this.prisma.user.findUnique({
        where: {
          partyId: dto.partyId,
        },
      });

      if (existingPartyUser) {
        throw new ConflictException(
          'This Daml party is already linked to another user',
        );
      }
    }

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: dto.passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        partyId: dto.partyId,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findActiveById(id: string) {
    const user = await this.findById(id);

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    return user;
  }

  async findByPartyId(partyId: string) {
    return this.prisma.user.findUnique({
      where: {
        partyId,
      },
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        partyId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
