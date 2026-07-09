import { Test, TestingModule } from '@nestjs/testing';
import { RedemptionsService } from './redemptions.service';

describe('RedemptionsService', () => {
  let service: RedemptionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedemptionsService],
    }).compile();

    service = module.get<RedemptionsService>(RedemptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
