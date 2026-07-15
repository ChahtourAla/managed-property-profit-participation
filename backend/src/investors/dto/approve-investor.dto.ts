import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveInvestorDto {
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
    example: 'LegalAdmin::1220abc...',
    description: 'Legacy field. Ignored by backend.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  legalAdmin?: string;

  @ApiProperty({
    example: 'Investor1::1220abc...',
    description: 'Daml party ID of the investor to approve',
  })
  @IsString()
  investor!: string;

  @ApiProperty({
    example: 'KYC-APPROVAL-INVESTOR-1',
    description: 'Business approval reference',
  })
  @IsString()
  approvalReference!: string;
}
