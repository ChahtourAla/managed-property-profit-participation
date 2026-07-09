import { IsOptional, IsString } from 'class-validator';

export class ValidateContractDto {
  @IsOptional()
  @IsString()
  easycoin?: string;
}
