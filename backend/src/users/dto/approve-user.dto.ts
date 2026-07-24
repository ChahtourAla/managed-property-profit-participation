import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApproveUserDto {
  @ApiProperty({
    example: 'Owner::1220abc...',
    description: 'Daml party ID to link to this approved user',
  })
  @IsString()
  partyId!: string;
}
