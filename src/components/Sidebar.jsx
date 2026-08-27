import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function HomeIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
      />
    </svg>
  )
}

function CubeIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.504 1.132a1 1 0 01.992 0l7 4A1 1 0 0118 6v8a1 1 0 01-.504.868l-7 4a1 1 0 01-.992 0l-7-4A1 1 0 012 14V6a1 1 0 01.504-.868l7-4zM10 3.152 5.104 6 10 8.848 14.896 6 10 3.152zM4 7.723v5.554l5 2.857V10.58L4 7.723zm7 8.411 5-2.857V7.723l-5 2.857v5.554z" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9.34 9.472a.75.75 0 011.32-.472c.148.12.29.267.29.5 0 .276-.15.42-.4.622-.31.25-.62.5-.62 1.128a.75.75 0 001.5 0c0-.2.1-.32.35-.52.35-.28.72-.63.72-1.23 0-.6-.34-1.06-.72-1.36a2.06 2.06 0 00-1.34-.55 2.06 2.06 0 00-1.34.55c-.38.3-.72.76-.72 1.36a.75.75 0 001.5 0zM10 14.25a.875.875 0 100-1.75.875.875 0 000 1.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const topLinks = [
  { to: '/', label: 'Home', end: true, icon: HomeIcon },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
  { to: '/products', label: 'Products', icon: CubeIcon },
]

const navGroups = [
  {
    label: 'Pricing',
    icon: TagIcon,
    links: [
      { to: '/price-lists', label: 'Price lists' },
      { to: '/price-editor', label: 'Price editor' },
    ],
  },
  {
    label: 'Customers',
    icon: UsersIcon,
    links: [
      { to: '/customers', label: 'Customers', end: true },
      { to: '/customers/agents', label: 'Agents' },
      { to: '/customers/groups', label: 'Groups' },
    ],
  },
]

function getInitials(user) {
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/)
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
  }
  return user?.email?.[0]?.toUpperCase() || '?'
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function NavGroup({ group, onNavigate }) {
  const location = useLocation()
  const hasActiveChild = group.links.some((l) =>
    l.end ? location.pathname === l.to : location.pathname.startsWith(l.to),
  )
  const [open, setOpen] = useState(hasActiveChild)
  const Icon = group.icon

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon />
          <span className="truncate whitespace-nowrap">{group.label}</span>
        </span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className="mt-1 space-y-1 pl-3">
          {group.links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block truncate whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M6 10a.75.75 0 0 1 .75-.75h9.19l-2.72-2.72a.75.75 0 1 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06l2.72-2.72H6.75A.75.75 0 0 1 6 10Z"
                clipRule="evenodd"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${
          open
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
          {getInitials(user)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">
            {user?.name || 'Account'}
          </span>
          <span className="block truncate text-xs text-gray-500">{user?.email}</span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth()

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      )}
      <nav
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[255px] shrink-0 flex-col border-r border-[#ebe6e7] bg-[#fbf9fa] transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-[#ebe6e7] px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
              S
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">Wholesale</p>
              {user?.shop && <p className="truncate text-xs text-gray-500">{user.shop}</p>}
            </div>
            <ChevronIcon open={false} />
          </div>
          <ul className="space-y-1">
            {topLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <link.icon />
                  <span className="truncate whitespace-nowrap">{link.label}</span>
                </NavLink>
              </li>
            ))}
            {navGroups.map((group) => (
              <NavGroup key={group.label} group={group} onNavigate={onClose} />
            ))}
          </ul>
        </div>
        <div className="shrink-0 border-t border-gray-200 p-4">
          <a
            href="#"
            className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <HelpIcon />
            Help
          </a>
          <UserMenu />
        </div>
      </nav>
    </>
  )
}
