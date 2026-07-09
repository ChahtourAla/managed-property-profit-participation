import { Test, TestingModule } from '@nestjs/testing';
import { RedemptionsController } from './redemptions.controller';

describe('RedemptionsController', () => {
  let controller: RedemptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RedemptionsController],
    }).compile();

    controller = module.get<RedemptionsController>(RedemptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
