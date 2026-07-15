import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'Investor1::1220abc...',
    description:
      'Legacy field. Ignored by backend. Investor party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  investor?: string;

  @ApiProperty({
    example: 'INSTR-MPC-001',
    description: 'Business instrument ID to subscribe to',
  })
  @IsString()
  instrumentId!: string;

  @ApiProperty({
    example: 100,
    description: 'Number of units requested by the investor',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  requestedUnits!: number;

  @ApiProperty({
    example: 6800,
    description: 'Upfront amount paid by the investor',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  upfrontAmount!: number;

  @ApiProperty({
    example: 'BANK-PAYMENT-INVESTOR-1',
    description: 'Payment reference for the upfront funding',
  })
  @IsString()
  paymentReference!: string;

  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;
}
