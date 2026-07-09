import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateOwnerDraftDto {
  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsOptional()
  @IsString()
  legalAdmin?: string;

  @IsOptional()
  @IsString()
  auditor?: string;

  @IsOptional()
  @IsString()
  paymentVerifier?: string;

  @IsString()
  contractId: string;

  @IsString()
  propertyId: string;

  @IsString()
  propertyName: string;

  @IsString()
  financialPeriod: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedRentalIncome: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedExpenses: number;

  @IsString()
  reportFrequency: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  easycoinFeeRate: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  ownerProfitShareOffered: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  ownerRetainedShare: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedInvestorSettlement: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  expectedUpfrontFunding: number;

  @IsString()
  currency: string;
}
