import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent')
    if (!accepted) setShow(true)
  }, [])

  if (!show) return null

  const accept = () => {
    localStorage.setItem('cookie_consent', 'true')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 max-w-[390px] mx-auto">
      <p className="text-sm text-gray-600 mb-3">
        Мы используем cookies для работы приложения и авторизации.
        Подробнее в{' '}
        <a href="/privacy" className="text-green-600 underline">
          Политике конфиденциальности
        </a>
      </p>
      <button
        onClick={accept}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold"
      >
        Принять
      </button>
    </div>
  )
}
