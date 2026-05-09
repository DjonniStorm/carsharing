import { useEffect } from 'react'

import { useAction } from '@reatom/react'

import { hydrateSessionFromStorage } from '@/features/auth/model/session'

const SessionBootstrap = () => {
  const hydrate = useAction(hydrateSessionFromStorage)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return null
}
SessionBootstrap.displayName = 'SessionBootstrap'

export { SessionBootstrap }
