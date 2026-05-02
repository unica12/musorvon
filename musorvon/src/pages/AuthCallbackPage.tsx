import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/useAppStore'
import { PENDING_ADDRESS_KEY } from './RegisterAddressPage'
import type { PendingAddress } from './RegisterAddressPage'
import { Button } from '../components/ui/Button'

const CALLBACK_TIMEOUT_MS = 15_000
const APP_URL = 'https://statuesque-choux-de7f07.netlify.app'

function isRunningAsPWA() {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const handled = useRef(false)
  const [showOpenApp, setShowOpenApp] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!handled.current) {
        handled.current = true
        localStorage.removeItem(PENDING_ADDRESS_KEY)
        toast.error('Ссылка устарела, попробуйте снова')
        navigate('/register/address', { replace: true })
      }
    }, CALLBACK_TIMEOUT_MS)

    async function finishRegistration(session: Session) {
      if (handled.current) return
      handled.current = true
      clearTimeout(timeoutId)

      try {
        const pendingStr = localStorage.getItem(PENDING_ADDRESS_KEY)

        if (!pendingStr) {
          // Returning user — fetch most recent apartment to populate the store
          const { data: apartment } = await supabase
            .from('apartments')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (apartment) {
            useAppStore.getState().setApartment(apartment)
            if (isRunningAsPWA()) {
              navigate('/home', { replace: true })
            } else {
              setShowOpenApp(true)
            }
          } else {
            toast.error('Заполните адрес для продолжения')
            navigate('/register/address', { replace: true })
          }
          return
        }

        const pending: PendingAddress = JSON.parse(pendingStr)

        // Check for existing apartment — re-registration after testing leaves stale rows
        const { data: existingApartment } = await supabase
          .from('apartments')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingApartment) {
          useAppStore.getState().setApartment(existingApartment)
          localStorage.removeItem(PENDING_ADDRESS_KEY)
          if (isRunningAsPWA()) {
            navigate('/home', { replace: true })
          } else {
            setShowOpenApp(true)
          }
          return
        }

        // Save name to user metadata
        if (pending.name) {
          await supabase.auth.updateUser({ data: { full_name: pending.name } })
        }

        // Insert apartment (email stored for admin panel display)
        const { data: apartmentData, error: insertError } = await supabase
          .from('apartments')
          .insert({
            user_id: session.user.id,
            building: pending.building,
            entrance: pending.entrance,
            floor: parseInt(pending.floor),
            apartment_number: pending.apartment_number,
            email: session.user.email ?? null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        useAppStore.getState().setApartment(apartmentData)
        localStorage.removeItem(PENDING_ADDRESS_KEY)
        localStorage.setItem('musorvon_registered', 'true')

        if (isRunningAsPWA()) {
          navigate('/home', { replace: true })
        } else {
          setShowOpenApp(true)
        }
      } catch (err) {
        console.error('[AuthCallbackPage] finishRegistration error:', err)
        localStorage.removeItem(PENDING_ADDRESS_KEY)
        toast.error('Не удалось завершить вход. Попробуйте снова.')
        navigate('/register/address', { replace: true })
      }
    }

    // Check for an existing session first — Supabase may have already processed the token
    // from the URL hash before this component mounted
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void finishRegistration(session)
      }
    })

    // Also listen for SIGNED_IN in case getSession resolves before the token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void finishRegistration(session)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [navigate])

  if (showOpenApp) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-[#F7FAF6]">
        <div className="flex flex-col items-center gap-6 text-center px-8">
          <div className="w-20 h-20 rounded-3xl bg-[#33A65A] flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
              <path d="M16 20h32l-4 28H20L16 20z" fill="white" fillOpacity="0.9" />
              <path
                d="M12 20h40M24 20v-4a4 4 0 018 0v4"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1A1F1A]">Вход выполнен!</h2>
            <p className="text-sm text-[#7F8A80] mt-2 leading-relaxed">
              Чтобы продолжить, откройте приложение на рабочем столе
            </p>
          </div>
          <Button
            fullWidth
            size="lg"
            onClick={() => { window.location.href = APP_URL + '/home' }}
          >
            Открыть МусорВон
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-dvh bg-[#F7FAF6]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-[#33A65A] flex items-center justify-center animate-pulse">
          <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
            <path d="M16 20h32l-4 28H20L16 20z" fill="white" fillOpacity="0.9" />
            <path
              d="M12 20h40M24 20v-4a4 4 0 018 0v4"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-sm text-[#7F8A80]">Выполняем вход...</p>
      </div>
    </div>
  )
}
