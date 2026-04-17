import { Inject, Injectable } from '@nestjs/common';
import type { TariffRepository } from '../repositories/tariff.repository';
import { REPOSITORY_TOKENS } from '../../../shared/tokens/repository.tokens';
import { CreateTariffInput, UpdateTariffInput } from '../../../shared/types/repository.types';

@Injectable()
export class TariffService {
  constructor(
    @Inject(REPOSITORY_TOKENS.tariff)
    private readonly tariffRepository: TariffRepository,
  ) {}

  async createTariff(data: CreateTariffInput) {
    return this.tariffRepository.create(data);
  }

  async updateTariff(id: number, data: UpdateTariffInput) {
    return this.tariffRepository.update(id, data);
  }

  async softDeleteTariff(id: number) {
    return this.tariffRepository.softDelete(id);
  }

  async restoreTariff(id: number) {
    return this.tariffRepository.restore(id);
  }

  async getTariffs() {
    return this.tariffRepository.findAll();
  }
}
