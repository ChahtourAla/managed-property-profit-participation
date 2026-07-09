import { IsOptional, IsString } from 'class-validator';

export class AcceptReportDto {
  @IsOptional()
  @IsString()
  auditor?: string;
}
