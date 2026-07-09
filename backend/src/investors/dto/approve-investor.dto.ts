import { IsOptional, IsString } from 'class-validator';

export class ApproveInvestorDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsOptional()
  @IsString()
  legalAdmin?: string;

  @IsString()
  investor: string;

  @IsString()
  approvalReference: string;
}
