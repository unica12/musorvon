import { useCallback } from 'react'
import { subscribeToPush } from '../lib/push'
import { useAppStore } from '../store/useAppStore'

export function usePush() {
  const { user } = useAppStore()

  const requestPushPermission = useCallback(async () => {
    if (!user) return
    try {
      await subscribeToPush(user.id)
    } catch (err) {
      console.error('Ошибка подписки на push:', err)
    }
  }, [user])

  return { requestPushPermission }
}
