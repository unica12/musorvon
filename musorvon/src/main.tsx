import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found')

// StrictMode removed: double-invocation of effects conflicts with
// Supabase auth lock and causes "Lock was not released within 5000ms" loop.
createRoot(rootEl).render(<App />)
