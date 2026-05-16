import { AppLogo } from './app-logo'

interface AppHeaderProps {
  repoUrl?: string
  onOpenHelp: () => void
}

export function AppHeader({
  repoUrl = 'https://github.com/ndanhkhoi/zero-gpx-route',
  onOpenHelp,
}: AppHeaderProps) {
  return (
    <header className="header-soft fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 bg-[var(--color-surface)]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <AppLogo size={32} className="shrink-0 sm:w-9 sm:h-9" />
        <h1 className="text-lg sm:text-2xl font-bold leading-none whitespace-nowrap truncate">
          GPX{' '}
          <span className="text-[var(--color-primary)]">Route</span>
        </h1>
      </div>
      <nav className="flex items-center gap-1 sm:gap-3 shrink-0" aria-label="External links">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-slate-300)] no-underline transition-all duration-200 hover:text-white hover:bg-[rgba(249,115,22,0.12)] cursor-pointer"
        >
          <i className="fab fa-github text-lg" aria-hidden="true" />
          <span className="hidden sm:inline text-sm">GitHub</span>
        </a>
        <button
          type="button"
          onClick={onOpenHelp}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--color-slate-300)] bg-transparent border-0 transition-all duration-200 hover:text-white hover:bg-[rgba(249,115,22,0.12)] cursor-pointer"
        >
          <i className="fas fa-circle-question text-lg" aria-hidden="true" />
          <span className="hidden sm:inline text-sm">Hướng dẫn</span>
        </button>
      </nav>
    </header>
  )
}
