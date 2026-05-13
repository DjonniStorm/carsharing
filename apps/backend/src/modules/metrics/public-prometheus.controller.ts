import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

import { Public } from 'src/modules/auth/decorators/public.decorator';

@Controller()
export class PublicPrometheusController extends PrometheusController {
  @Public()
  @Get()
  override index(
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    return super.index(response);
  }
}
