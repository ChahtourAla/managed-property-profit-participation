import { Test, TestingModule } from '@nestjs/testing';
import { DamlClientService } from './daml-client.service';

describe('DamlClientService', () => {
  let service: DamlClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DamlClientService],
    }).compile();

    service = module.get<DamlClientService>(DamlClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
