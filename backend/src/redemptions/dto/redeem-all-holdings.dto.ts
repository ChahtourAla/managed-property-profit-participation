import { IsOptional, IsString } from 'class-validator';

export class RedeemAllHoldingsDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsOptional()
  @IsString()
  burnReferencePrefix?: string;
}
