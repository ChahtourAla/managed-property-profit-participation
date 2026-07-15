import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePerformanceReportDto {
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
    example: '2026-Q3',
    description: 'Performance report period label',
  })
  @IsString()
  periodLabel!: string;

  @ApiProperty({
    example: 120000,
    description: 'Rental income for the reporting period',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentalIncome!: number;

  @ApiProperty({
    example: 24000,
    description: 'Expenses for the reporting period',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expenses!: number;

  @ApiProperty({
    example: 96000,
    description: 'Estimated net profit',
  })
  @Type(() => Number)
  @IsNumber()
  estimatedNetProfit!: number;

  @ApiProperty({
    example: 'ipfs://performance-report-mpc-001',
    description: 'URI of the performance report document',
  })
  @IsString()
  reportUri!: string;

  @ApiProperty({
    example: 'HASH-PERFORMANCE-REPORT-001',
    description: 'Hash of the performance report document',
  })
  @IsString()
  reportHash!: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the final performance report',
  })
  @Type(() => Boolean)
  @IsBoolean()
  isFinal!: boolean;
}
