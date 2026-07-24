import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApproveUserDto } from './dto/approve-user.dto';
import { RejectUserDto } from './dto/reject-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users / Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'List all users',
    description: 'ADMIN only. Returns all platform users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Users returned successfully',
  })
  @Get()
  listUsers() {
    return this.usersService.listUsers();
  }

  @ApiOperation({
    summary: 'List pending users',
    description: 'ADMIN only. Returns users waiting for approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending users returned successfully',
  })
  @Get('pending')
  listPendingUsers() {
    return this.usersService.listPendingUsers();
  }

  @ApiOperation({
    summary: 'Approve user',
    description:
      'ADMIN only. Approves a user, activates the account, and links a Daml partyId.',
  })
  @ApiResponse({
    status: 201,
    description: 'User approved successfully',
  })
  @Post(':userId/approve')
  approveUser(
    @Param('userId') userId: string,
    @Body() dto: ApproveUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.approveUser(userId, admin.id, dto.partyId);
  }

  @ApiOperation({
    summary: 'Reject user',
    description: 'ADMIN only. Rejects a pending user account.',
  })
  @ApiResponse({
    status: 201,
    description: 'User rejected successfully',
  })
  @Post(':userId/reject')
  rejectUser(
    @Param('userId') userId: string,
    @Body() dto: RejectUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usersService.rejectUser(userId, admin.id, dto.reason);
  }

  @ApiOperation({
    summary: 'Deactivate user',
    description: 'ADMIN only. Disables an approved user account.',
  })
  @Post(':userId/deactivate')
  deactivateUser(@Param('userId') userId: string) {
    return this.usersService.deactivateUser(userId);
  }

  @ApiOperation({
    summary: 'Reactivate user',
    description: 'ADMIN only. Reactivates an approved user account.',
  })
  @Post(':userId/reactivate')
  reactivateUser(@Param('userId') userId: string) {
    return this.usersService.reactivateUser(userId);
  }
}
