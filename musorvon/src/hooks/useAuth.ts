import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'

const AUTH_TIMEOUT_MS = 10_000

export function useAuth() {
  const { user } = useAppStore()

  useEffect(() => {
    const { setUser, setApartment, setLoading } = useAppStore.getState()

    setLoading(true)

    const timeoutId = setTimeout(() => {
      console.error('[useAuth] Auth init timed out after 10s')
      toast.error('Время ожидания истекло. Проверьте подключение к интернету.')
      setLoading(false)
    }, AUTH_TIMEOUT_MS)

    // getSession reads from localStorage — resolves immediately without network.
    // This guarantees setLoading(false) is always called, even if onAuthStateChange
    // never fires (e.g. network down, invalid key, Supabase initialisation error).
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('[useAuth] getSession resolved, user:', session?.user?.id ?? null)
        setUser(session?.user ?? null)
        if (session?.user) {
          return loadApartment(session.user.id, setApartment).finally(() => {
            clearTimeout(timeoutId)
            setLoading(false)
          })
        } else {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[useAuth] getSession error:', err)
        toast.error('Ошибка подключения к серверу. Попробуйте обновить страницу.')
        clearTimeout(timeoutId)
        setLoading(false)
      })

    // onAuthStateChange handles sign-in, sign-out, token refresh AFTER initial load.
    // It does NOT manage the isLoading flag — getSession owns that.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[useAuth] onAuthStateChange:', _event, session?.user?.id ?? null)
      setUser(session?.user ?? null)
      if (session?.user) {
        void loadApartment(session.user.id, setApartment)
      } else {
        setApartment(null)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadApartment(
    userId: string,
    setApartment: ReturnType<typeof useAppStore.getState>['setApartment'],
  ) {
    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      // Only overwrite with null if AuthCallbackPage hasn't already set the apartment
      if (data) {
        setApartment(data)
      } else if (!useAppStore.getState().apartment) {
        setApartment(null)
      }
    } catch (err) {
      console.error('[useAuth] loadApartment error:', err)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    useAppStore.getState().reset()
  }

  return { user, signOut }
}
