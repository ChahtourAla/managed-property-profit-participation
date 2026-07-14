import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsBoolean()
  isActive?: boolean;
}
