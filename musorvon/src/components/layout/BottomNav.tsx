import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/home',
    label: 'Главная',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={active ? '#33A65A' : 'none'}
        stroke={active ? '#33A65A' : '#7F8A80'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'История',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#33A65A' : '#7F8A80'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Профиль',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? '#33A65A' : '#7F8A80'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#E0EBE1] pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] justify-center"
          >
            {({ isActive }) => (
              <>
                {item.icon(isActive)}
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? 'text-[#33A65A]' : 'text-[#7F8A80]'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
