import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmFundingDto {
  @ApiProperty({
    example: 'BANK-CONFIRMED-PAYMENT-INVESTOR-1',
    description: 'Confirmed payment reference from the payment verifier',
  })
  @IsString()
  confirmedPaymentReference!: string;

  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiPropertyOptional({
    example: 'PaymentVerifier::1220abc...',
    description:
      'Legacy field. Ignored by backend. Payment verifier party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  paymentVerifier?: string;

  @ApiPropertyOptional({
    example: '00f7c1...',
    description:
      'Optional Daml TokenSupply contract ID. If omitted, backend finds the active supply automatically.',
  })
  @IsOptional()
  @IsString()
  supplyCid?: string;
}
