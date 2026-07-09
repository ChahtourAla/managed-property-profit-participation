import { IsOptional, IsString } from 'class-validator';

export class ConfirmRewardPaymentDto {
  @IsString()
  rewardPaymentReference: string;

  @IsOptional()
  @IsString()
  paymentVerifier?: string;
}
