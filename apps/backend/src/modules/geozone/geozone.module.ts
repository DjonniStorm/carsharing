import { Module } from '@nestjs/common';

import { GeozoneRepository } from './repositories/geozone.repository';
import { IGeozoneRepositoryToken } from './repositories/geozone.repository.interface';
import { GeozoneService } from './services/geozone.service';
import { GeozoneController } from './controllers/geozone.controller';

@Module({
  providers: [
    GeozoneService,
    { provide: IGeozoneRepositoryToken, useClass: GeozoneRepository },
  ],
  exports: [GeozoneService],
  controllers: [GeozoneController],
})
export class GeozoneModule {}
