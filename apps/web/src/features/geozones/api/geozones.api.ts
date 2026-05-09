import type {
  GeozoneCreateBody,
  GeozoneRead,
  GeozoneUpdateBody,
  GeozoneVersionCreateBody,
  GeozoneVersionRead,
  GeozoneType,
} from '@/entities/geozone'
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

export type GeozoneBoundingBoxQuery = {
  minLon: number
  minLat: number
  maxLon: number
  maxLat: number
  includeDeleted?: boolean
  types?: GeozoneType[]
}

export type GeozoneContainingPointQuery = {
  lon: number
  lat: number
  includeDeleted?: boolean
  types?: GeozoneType[]
}

export class GeozonesApi extends BaseApiClient {
  constructor(baseUrl: string, getAccessToken: AccessTokenGetter) {
    super(baseUrl, getAccessToken)
  }

  findInBoundingBox(q: GeozoneBoundingBoxQuery): Promise<GeozoneRead[]> {
    const typesParam = q.types?.length ? q.types.join(',') : undefined
    return this.getJson<GeozoneRead[]>(
      `/geozones/bounding-box${optionalQuery({
        minLon: String(q.minLon),
        minLat: String(q.minLat),
        maxLon: String(q.maxLon),
        maxLat: String(q.maxLat),
        includeDeleted:
          q.includeDeleted === undefined ? undefined : String(q.includeDeleted),
        types: typesParam,
      })}`,
    )
  }

  findContainingPoint(q: GeozoneContainingPointQuery): Promise<GeozoneRead[]> {
    const typesParam = q.types?.length ? q.types.join(',') : undefined
    return this.getJson<GeozoneRead[]>(
      `/geozones/containing-point${optionalQuery({
        lon: String(q.lon),
        lat: String(q.lat),
        includeDeleted:
          q.includeDeleted === undefined ? undefined : String(q.includeDeleted),
        types: typesParam,
      })}`,
    )
  }

  findAll(includeDeleted = false): Promise<GeozoneRead[]> {
    return this.getJson<GeozoneRead[]>(
      `/geozones${optionalQuery({ includeDeleted: String(includeDeleted) })}`,
    )
  }

  findById(id: string): Promise<GeozoneRead> {
    return this.getJson<GeozoneRead>(`/geozones/${encodeURIComponent(id)}`)
  }

  create(body: GeozoneCreateBody, createdByUserId?: string): Promise<GeozoneRead> {
    const qs =
      createdByUserId !== undefined
        ? optionalQuery({ createdByUserId })
        : ''
    return this.postJson<GeozoneRead>(`/geozones${qs}`, body)
  }

  update(id: string, body: GeozoneUpdateBody): Promise<GeozoneRead> {
    return this.patchJson<GeozoneRead>(
      `/geozones/${encodeURIComponent(id)}`,
      body,
    )
  }

  softDelete(id: string): Promise<GeozoneRead> {
    return this.deleteJson<GeozoneRead>(`/geozones/${encodeURIComponent(id)}`)
  }

  restore(id: string): Promise<GeozoneRead> {
    return this.postJson<GeozoneRead>(
      `/geozones/${encodeURIComponent(id)}/restore`,
      {},
    )
  }

  findVersions(id: string): Promise<GeozoneVersionRead[]> {
    return this.getJson<GeozoneVersionRead[]>(
      `/geozones/${encodeURIComponent(id)}/versions`,
    )
  }

  findVersionById(geozoneId: string, versionId: string): Promise<GeozoneVersionRead> {
    return this.getJson<GeozoneVersionRead>(
      `/geozones/${encodeURIComponent(geozoneId)}/versions/${encodeURIComponent(versionId)}`,
    )
  }

  publishVersion(id: string, body: GeozoneVersionCreateBody): Promise<GeozoneRead> {
    return this.postJson<GeozoneRead>(
      `/geozones/${encodeURIComponent(id)}/publish-version`,
      body,
    )
  }
}
