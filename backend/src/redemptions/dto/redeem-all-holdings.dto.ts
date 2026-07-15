import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RedeemAllHoldingsDto {
  @ApiPropertyOptional({
    example: 'Easycoin::1220abc...',
    description:
      'Legacy field. Ignored by backend. Easycoin party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  easycoin?: string;

  @ApiPropertyOptional({
    example: 'BURN-INSTR-MPC-001',
    description:
      'Prefix used by backend to generate burn references for all active holdings',
  })
  @IsOptional()
  @IsString()
  burnReferencePrefix?: string;
}
