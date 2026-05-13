import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { PublicPrometheusController } from './public-prometheus.controller';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      controller: PublicPrometheusController,
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}
