import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateOwnerDraftDto {
  @ApiPropertyOptional({
    example: 'Owner::1220abc...',
    description:
      'Legacy field. Ignored by backend. Owner party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is loaded from backend configuration.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiPropertyOptional({
    example: 'LegalAdmin::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  legalAdmin?: string;

  @ApiPropertyOptional({
    example: 'Auditor::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  auditor?: string;

  @ApiPropertyOptional({
    example: 'PaymentVerifier::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  paymentVerifier?: string;

  @ApiProperty({
    example: 'MPC-001',
    description: 'Business contract ID used by the platform',
  })
  @IsString()
  contractId!: string;

  @ApiProperty({
    example: 'PROP-001',
    description: 'Business property ID',
  })
  @IsString()
  propertyId!: string;

  @ApiProperty({
    example: 'Managed Apartment Casablanca',
    description: 'Property name',
  })
  @IsString()
  propertyName!: string;

  @ApiProperty({
    example: '2026',
    description: 'Financial period of the managed contract',
  })
  @IsString()
  financialPeriod!: string;

  @ApiProperty({
    example: 120000,
    description: 'Expected rental income',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedRentalIncome!: number;

  @ApiProperty({
    example: 24000,
    description: 'Expected property expenses',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedExpenses!: number;

  @ApiProperty({
    example: 'MONTHLY',
    description: 'Reporting frequency',
  })
  @IsString()
  reportFrequency!: string;

  @ApiProperty({
    example: 0.2,
    description: 'Easycoin fee rate. Example: 0.2 means 20%',
    minimum: 0,
    maximum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  easycoinFeeRate!: number;

  @ApiProperty({
    example: 0.5,
    description: 'Owner profit share offered to investors',
    minimum: 0,
    maximum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  ownerProfitShareOffered!: number;

  @ApiProperty({
    example: 0.5,
    description: 'Owner retained profit share',
    minimum: 0,
    maximum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  ownerRetainedShare!: number;

  @ApiProperty({
    example: 38400,
    description: 'Expected future amount distributed to investors',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedInvestorSettlement!: number;

  @ApiProperty({
    example: 34000,
    description: 'Expected upfront funding paid by investors',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedUpfrontFunding!: number;

  @ApiProperty({
    example: 'MAD',
    description: 'Currency',
  })
  @IsString()
  currency!: string;
}
