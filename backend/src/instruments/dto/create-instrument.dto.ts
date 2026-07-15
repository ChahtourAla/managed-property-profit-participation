import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInstrumentDto {
  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiProperty({
    example: 'MPC-001',
    description: 'Business contract ID of the validated managed contract',
  })
  @IsString()
  contractId!: string;

  @ApiProperty({
    example: 'INSTR-MPC-001',
    description: 'Business instrument ID to create',
  })
  @IsString()
  instrumentId!: string;

  @ApiProperty({
    example: 1000,
    description: 'Total number of profit participation units',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalUnits!: number;

  @ApiProperty({
    example: 76.8,
    description: 'Nominal future profit value per unit',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  nominalValuePerUnit!: number;

  @ApiProperty({
    example: 68,
    description: 'Discounted upfront price paid by investors per unit',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  investorUpfrontPricePerUnit!: number;

  @ApiProperty({
    example: [
      'Investor1::1220abc...',
      'Investor2::1220abc...',
      'Investor3::1220abc...',
    ],
    description: 'List of approved investor Daml parties',
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  approvedInvestors!: string[];
}
