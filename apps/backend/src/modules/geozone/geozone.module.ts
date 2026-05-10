import { Module } from '@nestjs/common';

import { TariffModule } from '../tariff/tariff.module';

import { GeozoneRepository } from './repositories/geozone.repository';
import { IGeozoneRepositoryToken } from './repositories/geozone.repository.interface';
import { GeozoneService } from './services/geozone.service';
import { GeozoneController } from './controllers/geozone.controller';

@Module({
  imports: [TariffModule],
  providers: [
    GeozoneService,
    { provide: IGeozoneRepositoryToken, useClass: GeozoneRepository },
  ],
  exports: [GeozoneService, IGeozoneRepositoryToken],
  controllers: [GeozoneController],
})
export class GeozoneModule {}
