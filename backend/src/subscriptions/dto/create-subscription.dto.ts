import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSubscriptionDto {
  /**
   * Legacy field.
   * We keep it optional for compatibility, but the backend will ignore it.
   * The real investor party comes from the authenticated JWT user.
   */
  @IsOptional()
  @IsString()
  investor?: string;

  @IsString()
  instrumentId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  requestedUnits!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  upfrontAmount!: number;

  @IsString()
  paymentReference!: string;

  /**
   * Legacy field.
   * Ignored for authenticated investor flow.
   */
  @IsOptional()
  @IsString()
  easycoin?: string;
}
