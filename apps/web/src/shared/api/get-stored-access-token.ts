import { ACCESS_TOKEN_STORAGE_KEY } from '@/shared/config/access-token-storage-key'

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}
