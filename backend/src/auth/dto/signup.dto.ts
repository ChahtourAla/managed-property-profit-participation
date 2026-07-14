import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsOptional()
  @IsString()
  partyId?: string;
}
