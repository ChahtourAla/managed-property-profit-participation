import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserApprovalStatus } from '../common/enums/user-approval-status.enum';
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
      await this.ensurePartyIsAvailable(dto.partyId);
    }

    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: dto.passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        partyId: dto.partyId,
        approvalStatus: dto.approvalStatus ?? UserApprovalStatus.PENDING,
        isActive: dto.isActive ?? false,
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

  async findApprovedActiveById(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.approvalStatus !== UserApprovalStatus.APPROVED) {
      throw new BadRequestException('User account is not approved');
    }

    if (!user.isActive) {
      throw new BadRequestException('User account is inactive');
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
        approvalStatus: true,
        isActive: true,
        approvedById: true,
        approvedAt: true,
        rejectedById: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listPendingUsers() {
    return this.prisma.user.findMany({
      where: {
        approvalStatus: UserApprovalStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        partyId: true,
        approvalStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async approveUser(userId: string, adminId: string, partyId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.approvalStatus === UserApprovalStatus.APPROVED) {
      throw new BadRequestException('User is already approved');
    }

    await this.ensurePartyIsAvailable(partyId, userId);

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        partyId,
        approvalStatus: UserApprovalStatus.APPROVED,
        isActive: true,
        approvedById: adminId,
        approvedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        partyId: true,
        approvalStatus: true,
        isActive: true,
        approvedById: true,
        approvedAt: true,
      },
    });
  }

  async rejectUser(userId: string, adminId: string, reason: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        approvalStatus: UserApprovalStatus.REJECTED,
        isActive: false,
        rejectedById: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        partyId: true,
        approvalStatus: true,
        isActive: true,
        rejectedById: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });
  }

  async deactivateUser(userId: string) {
    await this.ensureUserExists(userId);

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async reactivateUser(userId: string) {
    const user = await this.ensureUserExists(userId);

    if (user.approvalStatus !== UserApprovalStatus.APPROVED) {
      throw new BadRequestException('Only approved users can be reactivated');
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isActive: true,
      },
    });
  }

  private async ensureUserExists(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensurePartyIsAvailable(
    partyId: string,
    currentUserId?: string,
  ) {
    const existingPartyUser = await this.prisma.user.findUnique({
      where: {
        partyId,
      },
    });

    if (existingPartyUser && existingPartyUser.id !== currentUserId) {
      throw new ConflictException(
        'This Daml party is already linked to another user',
      );
    }
  }
}
