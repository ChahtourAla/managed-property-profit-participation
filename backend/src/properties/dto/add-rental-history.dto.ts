import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddRentalHistoryDto {
  @ApiProperty({
    example: '2025',
    description: 'Period label such as 2025, 2026-Q1, Jan 2026',
  })
  @IsString()
  periodLabel!: string;

  @ApiProperty({
    example: 110000,
  })
  @IsNumber()
  @Min(0)
  rentalIncome!: number;

  @ApiPropertyOptional({
    example: 22000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expenses?: number;

  @ApiPropertyOptional({
    example: 0.87,
    description: 'Occupancy rate between 0 and 1',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  occupancyRate?: number;

  @ApiPropertyOptional({
    example: 88000,
  })
  @IsOptional()
  @IsNumber()
  netIncome?: number;

  @ApiPropertyOptional({
    example: 'MAD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
