import { useState } from 'react'

const STORAGE_KEY = 'sparklayer-theme'

export function applySavedTheme() {
  let mode = 'light'
  try {
    mode = localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    // storage blocked: stay light
  }
  document.documentElement.classList.toggle('dark', mode === 'dark')
  return mode
}

function SunIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
    </svg>
  )
}

export default function ThemeToggle() {
  const [mode, setMode] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  function choose(next) {
    setMode(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked: the choice lasts until reload
    }
  }

  const base = 'flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors'
  const on = 'border border-slate-200 bg-white text-slate-800 shadow-sm'
  const off = 'border border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'

  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800" role="group" aria-label="Colour mode">
      <button type="button" onClick={() => choose('light')} aria-pressed={mode === 'light'} className={`${base} ${mode === 'light' ? on : off}`}>
        <SunIcon /> Light Mode
      </button>
      <button type="button" onClick={() => choose('dark')} aria-pressed={mode === 'dark'} className={`${base} ${mode === 'dark' ? 'border border-slate-700 bg-slate-900 text-white shadow-sm' : off}`}>
        <MoonIcon /> Dark Mode
      </button>
    </div>
  )
}
