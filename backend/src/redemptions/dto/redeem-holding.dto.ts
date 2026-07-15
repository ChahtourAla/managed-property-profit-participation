import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RedeemHoldingDto {
  @ApiProperty({
    example: '00f7c1...',
    description: 'ProfitParticipationHolding Daml contract ID to redeem',
  })
  @IsString()
  holdingCid!: string;

  @ApiProperty({
    example: 'BURN-INSTR-MPC-001-Investor1-1',
    description: 'Burn reference',
  })
  @IsString()
  burnReference!: string;

  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;
}
