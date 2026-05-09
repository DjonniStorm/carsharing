import { getApiBaseUrl } from '@/shared/config/env'
import { getStoredAccessToken } from '@/shared/api/get-stored-access-token'

import { GeozonesApi } from './geozones.api'

export const geozonesApi = new GeozonesApi(getApiBaseUrl(), getStoredAccessToken)

export { GeozonesApi } from './geozones.api'
export type { GeozoneBoundingBoxQuery, GeozoneContainingPointQuery } from './geozones.api'
