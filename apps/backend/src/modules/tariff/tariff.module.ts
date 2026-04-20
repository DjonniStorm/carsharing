import { Module } from '@nestjs/common';

import { TariffController } from './controllers/tariff.controller';
import { TariffRepository } from './repositories/tariff.repository';
import { ITariffRepositoryToken } from './repositories/tariff.repository.interface';
import { TariffService } from './services/tariff.service';

@Module({
  controllers: [TariffController],
  providers: [
    TariffService,
    { provide: ITariffRepositoryToken, useClass: TariffRepository },
  ],
  exports: [TariffService],
})
export class TariffModule {}
