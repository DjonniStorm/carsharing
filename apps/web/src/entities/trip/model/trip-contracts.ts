import type { TripStatus } from '@/entities/trip/model/trip-status'

export type TripRead = {
  id: string
  userId: string
  carId: string
  tariffVersionId: string
  status: TripStatus
  startedAt: string
  finishedAt: string | null
  pauseStartedAt: string | null
  totalPausedSec: number
  startLat: number | null
  startLng: number | null
  finishLat: number | null
  finishLng: number | null
  distance: number
  duration: number
  distanceMeters: number | null
  chargedMinutes: number | null
  chargedKm: number | null
  priceTime: number | null
  priceDistance: number | null
  pricePause: number | null
  priceTotal: number | null
  createdAt: string
  updatedAt: string
  carPlateSnapshot: string | null
  carDisplayNameSnapshot: string | null
}

export type TripCreateBody = {
  userId: string
  carId: string
  tariffVersionId: string
  status?: TripStatus
  startLat?: number
  startLng?: number
  carPlateSnapshot?: string
  carDisplayNameSnapshot?: string
}

export type TripUpdateBody = Partial<{
  status: TripStatus
  finishedAt: string
  pauseStartedAt: string | null
  totalPausedSec: number
  startLat: number | null
  startLng: number | null
  finishLat: number | null
  finishLng: number | null
  distance: number
  duration: number
  distanceMeters: number | null
  chargedMinutes: number | null
  chargedKm: number | null
  priceTime: number | null
  priceDistance: number | null
  pricePause: number | null
  priceTotal: number | null
  tariffVersionId: string
  carPlateSnapshot: string | null
  carDisplayNameSnapshot: string | null
}>
