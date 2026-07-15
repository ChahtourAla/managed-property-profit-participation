import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AcceptReportDto {
  @ApiPropertyOptional({
    example: 'Auditor::1220abc...',
    description:
      'Legacy field. Ignored by backend. Auditor party is taken from authenticated JWT user.',
    deprecated: true,
  })
  @IsOptional()
  @IsString()
  auditor?: string;
}
