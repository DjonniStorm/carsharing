import type {
  CarCreateBody,
  CarRead,
  CarUpdateBody,
  UpdatePositionBody,
} from '@/entities/car'
import { BaseApiClient } from '@/shared/api'
import type { AccessTokenGetter } from '@/shared/api/base-api-client'

function optionalQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') {
      sp.set(k, v)
    }
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export class CarsApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken)
  }

  findAll(includeDeleted = false): Promise<CarRead[]> {
    return this.getJson<CarRead[]>(`/cars${optionalQuery({ includeDeleted: String(includeDeleted) })}`)
  }

  findById(id: string): Promise<CarRead> {
    return this.getJson<CarRead>(`/cars/${encodeURIComponent(id)}`)
  }

  findByLicensePlate(licensePlate: string): Promise<CarRead> {
    return this.getJson<CarRead>(
      `/cars/license-plate/${encodeURIComponent(licensePlate)}`,
    )
  }

  create(body: CarCreateBody): Promise<CarRead> {
    return this.postJson<CarRead>('/cars', body)
  }

  update(id: string, body: CarUpdateBody): Promise<CarRead> {
    return this.patchJson<CarRead>(`/cars/${encodeURIComponent(id)}`, body)
  }

  remove(id: string): Promise<CarRead> {
    return this.deleteJson<CarRead>(`/cars/${encodeURIComponent(id)}`)
  }

  restore(id: string): Promise<CarRead> {
    return this.postJson<CarRead>(`/cars/restore/${encodeURIComponent(id)}`, {})
  }

  updatePosition(id: string, body: UpdatePositionBody): Promise<CarRead> {
    return this.postJson<CarRead>(
      `/cars/update-position/${encodeURIComponent(id)}`,
      body,
    )
  }
}
