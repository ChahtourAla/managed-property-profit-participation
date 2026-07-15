import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { UserRole } from '../../common/enums/user-role.enum';

export class SignupDto {
  @ApiProperty({
    example: 'owner@test.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password with at least 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'Property Owner',
    description: 'User full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.OWNER,
    description: 'User role in the platform',
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiPropertyOptional({
    example: 'Owner::1220abc...',
    description: 'Linked Daml party ID',
  })
  @IsOptional()
  @IsString()
  partyId?: string;
}
