import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AddPropertyDocumentDto } from './dto/add-property-document.dto';
import { AddPropertyImageDto } from './dto/add-property-image.dto';
import { AddRentalHistoryDto } from './dto/add-rental-history.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @ApiOperation({
    summary: 'Create property profile',
    description:
      'OWNER only. Creates property information before contract draft.',
  })
  @ApiResponse({
    status: 201,
    description: 'Property created successfully',
  })
  @Roles(UserRole.OWNER)
  @Post()
  createProperty(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.createProperty(user, dto);
  }

  @ApiOperation({
    summary: 'List my properties',
    description:
      'OWNER only. Returns properties created by the authenticated owner.',
  })
  @Roles(UserRole.OWNER)
  @Get('my')
  listMyProperties(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.listMyProperties(user);
  }

  @ApiOperation({
    summary: 'List properties',
    description:
      'ADMIN and EASYCOIN see all properties. Other users see published properties.',
  })
  @Roles(
    UserRole.ADMIN,
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.PAYMENT_VERIFIER,
    UserRole.LEGAL_ADMIN,
  )
  @Get()
  listProperties(@CurrentUser() user: AuthenticatedUser) {
    return this.propertiesService.listProperties(user);
  }

  @ApiOperation({
    summary: 'Get property details',
    description:
      'Returns property details, images, rental history, and documents.',
  })
  @Roles(
    UserRole.ADMIN,
    UserRole.EASYCOIN,
    UserRole.OWNER,
    UserRole.INVESTOR,
    UserRole.AUDITOR,
    UserRole.PAYMENT_VERIFIER,
    UserRole.LEGAL_ADMIN,
  )
  @Get(':propertyId')
  getProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.getProperty(propertyId, user);
  }

  @ApiOperation({
    summary: 'Update property',
    description: 'OWNER only. Only draft properties can be edited.',
  })
  @Roles(UserRole.OWNER)
  @Patch(':propertyId')
  updateProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.updateProperty(propertyId, user, dto);
  }

  @ApiOperation({
    summary: 'Add property image',
    description: 'OWNER only. Adds image URL/path to a draft property.',
  })
  @Roles(UserRole.OWNER)
  @Post(':propertyId/images')
  addImage(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddPropertyImageDto,
  ) {
    return this.propertiesService.addImage(propertyId, user, dto);
  }

  @ApiOperation({
    summary: 'Add rental history',
    description: 'OWNER only. Adds historical rental data to a draft property.',
  })
  @Roles(UserRole.OWNER)
  @Post(':propertyId/rental-history')
  addRentalHistory(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddRentalHistoryDto,
  ) {
    return this.propertiesService.addRentalHistory(propertyId, user, dto);
  }

  @ApiOperation({
    summary: 'Add property document',
    description: 'OWNER only. Adds document URL/path to a draft property.',
  })
  @Roles(UserRole.OWNER)
  @Post(':propertyId/documents')
  addDocument(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddPropertyDocumentDto,
  ) {
    return this.propertiesService.addDocument(propertyId, user, dto);
  }

  @ApiOperation({
    summary: 'Submit property for review',
    description:
      'OWNER only. Changes property status from DRAFT to PENDING_REVIEW.',
  })
  @Roles(UserRole.OWNER)
  @Post(':propertyId/submit-review')
  submitForReview(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertiesService.submitForReview(propertyId, user);
  }

  @ApiOperation({
    summary: 'Approve property',
    description: 'ADMIN or EASYCOIN only. Approves a property pending review.',
  })
  @Roles(UserRole.ADMIN, UserRole.EASYCOIN)
  @Post(':propertyId/approve')
  approveProperty(@Param('propertyId') propertyId: string) {
    return this.propertiesService.approveProperty(propertyId);
  }

  @ApiOperation({
    summary: 'Publish property',
    description:
      'ADMIN or EASYCOIN only. Publishes an approved property for investors.',
  })
  @Roles(UserRole.ADMIN, UserRole.EASYCOIN)
  @Post(':propertyId/publish')
  publishProperty(@Param('propertyId') propertyId: string) {
    return this.propertiesService.publishProperty(propertyId);
  }
}
