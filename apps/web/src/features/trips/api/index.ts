import { getApiBaseUrl } from '@/shared/config/env'
import { getStoredAccessToken } from '@/shared/api/get-stored-access-token'

import { TripsApi } from './trips.api'

export const tripsApi = new TripsApi(getApiBaseUrl(), getStoredAccessToken)

export { TripsApi } from './trips.api'
export type { TripByIdQuery, TripListQuery } from './trips.api'
