import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRole } from '../common/enums/user-role.enum';
import { PropertyStatus } from '../common/enums/property-status.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { AddPropertyDocumentDto } from './dto/add-property-document.dto';
import { AddPropertyImageDto } from './dto/add-property-image.dto';
import { AddRentalHistoryDto } from './dto/add-rental-history.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createProperty(user: AuthenticatedUser, dto: CreatePropertyDto) {
    const existingProperty = await this.prisma.property.findUnique({
      where: {
        propertyId: dto.propertyId,
      },
    });

    if (existingProperty) {
      throw new ConflictException(
        'A property with this propertyId already exists',
      );
    }

    return this.prisma.property.create({
      data: {
        propertyId: dto.propertyId,
        ownerUserId: user.id,
        ownerPartyId: user.partyId,
        name: dto.name,
        description: dto.description,
        propertyType: dto.propertyType,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        surfaceArea: dto.surfaceArea,
        rooms: dto.rooms,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        expectedRentalIncome: dto.expectedRentalIncome,
        expectedExpenses: dto.expectedExpenses,
        currency: dto.currency ?? 'MAD',
        status: PropertyStatus.DRAFT,
      },
      include: this.propertyInclude(),
    });
  }

  async listMyProperties(user: AuthenticatedUser) {
    return this.prisma.property.findMany({
      where: {
        ownerUserId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.propertyInclude(),
    });
  }

  async listProperties(user: AuthenticatedUser) {
    const canViewAll =
      user.role === UserRole.ADMIN || user.role === UserRole.EASYCOIN;

    const where = canViewAll
      ? {}
      : {
          status: PropertyStatus.PUBLISHED,
        };

    return this.prisma.property.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: this.propertyInclude(),
    });
  }

  async getProperty(propertyId: string, user: AuthenticatedUser) {
    const property = await this.prisma.property.findUnique({
      where: {
        propertyId,
      },
      include: this.propertyInclude(),
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    this.ensureCanViewProperty(user, property);

    return property;
  }

  async updateProperty(
    propertyId: string,
    user: AuthenticatedUser,
    dto: UpdatePropertyDto,
  ) {
    const property = await this.getOwnedProperty(propertyId, user.id);

    this.ensurePropertyIsEditable(property.status);

    return this.prisma.property.update({
      where: {
        propertyId,
      },
      data: {
        name: dto.name,
        description: dto.description,
        propertyType: dto.propertyType,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        surfaceArea: dto.surfaceArea,
        rooms: dto.rooms,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        expectedRentalIncome: dto.expectedRentalIncome,
        expectedExpenses: dto.expectedExpenses,
        currency: dto.currency,
      },
      include: this.propertyInclude(),
    });
  }

  async addImage(
    propertyId: string,
    user: AuthenticatedUser,
    dto: AddPropertyImageDto,
  ) {
    const property = await this.getOwnedProperty(propertyId, user.id);

    this.ensurePropertyIsEditable(property.status);

    return this.prisma.propertyImage.create({
      data: {
        propertyDbId: property.id,
        url: dto.url,
        caption: dto.caption,
        isMain: dto.isMain ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async addRentalHistory(
    propertyId: string,
    user: AuthenticatedUser,
    dto: AddRentalHistoryDto,
  ) {
    const property = await this.getOwnedProperty(propertyId, user.id);

    this.ensurePropertyIsEditable(property.status);

    return this.prisma.rentalHistory.create({
      data: {
        propertyDbId: property.id,
        periodLabel: dto.periodLabel,
        rentalIncome: dto.rentalIncome,
        expenses: dto.expenses,
        occupancyRate: dto.occupancyRate,
        netIncome: dto.netIncome,
        currency: dto.currency ?? property.currency,
      },
    });
  }

  async addDocument(
    propertyId: string,
    user: AuthenticatedUser,
    dto: AddPropertyDocumentDto,
  ) {
    const property = await this.getOwnedProperty(propertyId, user.id);

    this.ensurePropertyIsEditable(property.status);

    return this.prisma.propertyDocument.create({
      data: {
        propertyDbId: property.id,
        name: dto.name,
        url: dto.url,
        documentHash: dto.documentHash,
      },
    });
  }

  async submitForReview(propertyId: string, user: AuthenticatedUser) {
    const property = await this.getOwnedProperty(propertyId, user.id);

    this.ensurePropertyIsEditable(property.status);

    return this.prisma.property.update({
      where: {
        propertyId,
      },
      data: {
        status: PropertyStatus.PENDING_REVIEW,
      },
      include: this.propertyInclude(),
    });
  }

  async approveProperty(propertyId: string) {
    const property = await this.findPropertyOrThrow(propertyId);

    if (property.status !== PropertyStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        'Only properties pending review can be approved',
      );
    }

    return this.prisma.property.update({
      where: {
        propertyId,
      },
      data: {
        status: PropertyStatus.APPROVED,
      },
      include: this.propertyInclude(),
    });
  }

  async publishProperty(propertyId: string) {
    const property = await this.findPropertyOrThrow(propertyId);

    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved properties can be published',
      );
    }

    return this.prisma.property.update({
      where: {
        propertyId,
      },
      data: {
        status: PropertyStatus.PUBLISHED,
      },
      include: this.propertyInclude(),
    });
  }

  private async getOwnedProperty(propertyId: string, ownerUserId: string) {
    const property = await this.prisma.property.findUnique({
      where: {
        propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You do not own this property');
    }

    return property;
  }

  private async findPropertyOrThrow(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: {
        propertyId,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return property;
  }

  private ensurePropertyIsEditable(status: string) {
    if (status !== PropertyStatus.DRAFT) {
      throw new BadRequestException('Only draft properties can be edited');
    }
  }

  private ensureCanViewProperty(
    user: AuthenticatedUser,
    property: { ownerUserId: string; status: string },
  ) {
    const canViewAll =
      user.role === UserRole.ADMIN || user.role === UserRole.EASYCOIN;

    const isOwner = property.ownerUserId === user.id;

    const isPublished = property.status === PropertyStatus.PUBLISHED;

    if (!canViewAll && !isOwner && !isPublished) {
      throw new ForbiddenException('You cannot view this property');
    }
  }

  private propertyInclude() {
    return {
      owner: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          partyId: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: 'asc' as const,
        },
      },
      rentalHistory: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
      documents: {
        orderBy: {
          createdAt: 'desc' as const,
        },
      },
    };
  }
}
