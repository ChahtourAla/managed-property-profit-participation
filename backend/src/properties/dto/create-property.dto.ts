import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({
    example: 'PROP-001',
    description: 'Unique business property ID',
  })
  @IsString()
  propertyId!: string;

  @ApiProperty({
    example: 'Managed Apartment Casablanca',
    description: 'Property name shown to investors',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    example: 'Modern apartment in a high-demand rental area.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Apartment',
  })
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional({
    example: 'Maarif, Casablanca',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'Casablanca',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    example: 'Morocco',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    example: 85,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  surfaceArea?: number;

  @ApiPropertyOptional({
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rooms?: number;

  @ApiPropertyOptional({
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiPropertyOptional({
    example: 120000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedRentalIncome?: number;

  @ApiPropertyOptional({
    example: 24000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedExpenses?: number;

  @ApiPropertyOptional({
    example: 'MAD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
