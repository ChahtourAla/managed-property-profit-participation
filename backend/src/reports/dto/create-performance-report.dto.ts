import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePerformanceReportDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsString()
  instrumentId: string;

  @IsString()
  periodLabel: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rentalIncome: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expenses: number;

  @Type(() => Number)
  @IsNumber()
  estimatedNetProfit: number;

  @IsString()
  reportUri: string;

  @IsString()
  reportHash: string;

  @Type(() => Boolean)
  @IsBoolean()
  isFinal: boolean;
}
