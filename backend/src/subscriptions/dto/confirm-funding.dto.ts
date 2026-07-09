import { IsOptional, IsString } from 'class-validator';

export class ConfirmFundingDto {
  @IsString()
  confirmedPaymentReference: string;

  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsOptional()
  @IsString()
  paymentVerifier?: string;

  /**
   * Optional.
   * If not provided, the backend will find the active TokenSupply
   * using the subscription instrumentId.
   */
  @IsOptional()
  @IsString()
  supplyCid?: string;
}
