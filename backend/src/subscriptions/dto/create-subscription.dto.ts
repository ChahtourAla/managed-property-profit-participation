import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  investor: string;

  @IsString()
  instrumentId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  requestedUnits: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  upfrontAmount: number;

  @IsString()
  paymentReference: string;

  @IsOptional()
  @IsString()
  easycoin?: string;
}
