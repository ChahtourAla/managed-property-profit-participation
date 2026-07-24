import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { UserApprovalStatus } from '../../common/enums/user-approval-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  passwordHash!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  partyId?: string;

  @IsOptional()
  @IsEnum(UserApprovalStatus)
  approvalStatus?: UserApprovalStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
