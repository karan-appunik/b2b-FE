import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[#ebe6e7] bg-[#fbf9fa] px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900">Wholesale</span>
        </header>

        <main className="flex-1">
          <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 sm:mt-12 sm:gap-12 sm:px-8 sm:pb-24">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
