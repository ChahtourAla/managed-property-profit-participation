import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectContractDto {
  @IsOptional()
  @IsString()
  easycoin?: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
