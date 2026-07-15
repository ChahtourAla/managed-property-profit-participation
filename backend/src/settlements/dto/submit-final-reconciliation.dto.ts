import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitFinalReconciliationDto {
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
    example: 'INSTR-MPC-001',
    description: 'Business instrument ID',
  })
  @IsString()
  instrumentId!: string;

  @ApiProperty({
    example: 120000,
    description: 'Total rental income',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRentalIncome!: number;

  @ApiProperty({
    example: 24000,
    description: 'Total expenses',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalExpenses!: number;

  @ApiProperty({
    example: 96000,
    description: 'Net profit before Easycoin fee',
  })
  @Type(() => Number)
  @IsNumber()
  netProfitBeforeFee!: number;

  @ApiProperty({
    example: 19200,
    description: 'Easycoin fee amount',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  easycoinFee!: number;

  @ApiProperty({
    example: 76800,
    description: 'Owner-side distributable profit after Easycoin fee',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ownerSideDistributableProfit!: number;

  @ApiProperty({
    example: 38400,
    description: 'Profit pool distributed to investors',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  investorRewardPool!: number;

  @ApiProperty({
    example: 38400,
    description: 'Profit retained by the owner',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ownerRetainedProfit!: number;

  @ApiProperty({
    example: 'HASH-FINAL-REPORT-001',
    description: 'Hash of the final report',
  })
  @IsString()
  finalReportHash!: string;
}
