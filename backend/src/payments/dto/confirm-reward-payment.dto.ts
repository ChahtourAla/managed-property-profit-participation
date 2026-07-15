import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmRewardPaymentDto {
  @ApiProperty({
    example: 'BANK-REWARD-PAYMENT-INVESTOR-1',
    description: 'Reward payment confirmation reference',
  })
  @IsString()
  rewardPaymentReference!: string;

  @ApiPropertyOptional({
    example: 'PaymentVerifier::1220abc...',
    description:
      'Legacy field. Ignored by backend. Payment verifier party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  paymentVerifier?: string;
}
