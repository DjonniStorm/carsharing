import { describe, expect, it } from 'vitest';

import { ViolationStatus } from '../../violation/entities/violation.status';
import { CarStatus } from '../entities/car-status';
import { evaluateCarAvailability } from './car-availability.evaluator';

describe('evaluateCarAvailability', () => {
  it('returns AVAILABLE when no open violations', () => {
    expect(evaluateCarAvailability([])).toEqual({
      carStatus: CarStatus.AVAILABLE,
      isAvailable: true,
    });
    expect(
      evaluateCarAvailability([
        ViolationStatus.RESOLVED,
        ViolationStatus.IGNORED,
      ]),
    ).toEqual({
      carStatus: CarStatus.AVAILABLE,
      isAvailable: true,
    });
  });

  it('returns OUT_OF_SERVICE for WRONG_PARKING', () => {
    expect(evaluateCarAvailability([ViolationStatus.WRONG_PARKING])).toEqual({
      carStatus: CarStatus.OUT_OF_SERVICE,
      isAvailable: false,
    });
  });

  it('returns OUT_OF_SERVICE for OUT_OF_GEOZONE', () => {
    expect(evaluateCarAvailability([ViolationStatus.OUT_OF_GEOZONE])).toEqual({
      carStatus: CarStatus.OUT_OF_SERVICE,
      isAvailable: false,
    });
  });

  it('returns UNAVAILABLE with isAvailable=false for LOW_FUEL', () => {
    expect(evaluateCarAvailability([ViolationStatus.LOW_FUEL])).toEqual({
      carStatus: CarStatus.UNAVAILABLE,
      isAvailable: false,
    });
  });

  it('returns UNAVAILABLE with isAvailable=true for SPEEDING only', () => {
    expect(evaluateCarAvailability([ViolationStatus.SPEEDING])).toEqual({
      carStatus: CarStatus.UNAVAILABLE,
      isAvailable: true,
    });
  });

  it('prioritizes OUT_OF_SERVICE over LOW_FUEL', () => {
    expect(
      evaluateCarAvailability([
        ViolationStatus.LOW_FUEL,
        ViolationStatus.WRONG_PARKING,
      ]),
    ).toEqual({
      carStatus: CarStatus.OUT_OF_SERVICE,
      isAvailable: false,
    });
  });
});
