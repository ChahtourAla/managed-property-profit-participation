import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SubmitFinalReconciliationDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsString()
  instrumentId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRentalIncome: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalExpenses: number;

  @Type(() => Number)
  @IsNumber()
  netProfitBeforeFee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  easycoinFee: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ownerSideDistributableProfit: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  investorRewardPool: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ownerRetainedProfit: number;

  @IsString()
  finalReportHash: string;
}
