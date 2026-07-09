import { Test, TestingModule } from '@nestjs/testing';
import { HoldingsController } from './holdings.controller';

describe('HoldingsController', () => {
  let controller: HoldingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HoldingsController],
    }).compile();

    controller = module.get<HoldingsController>(HoldingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
