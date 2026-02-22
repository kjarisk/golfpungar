import { Suspense } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router'
import {
  Newspaper,
  PenLine,
  Trophy,
  Flag,
  Users,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from '@/components/error-boundary'
import { PageSkeleton } from '@/components/page-skeleton'
import { useTournamentStore } from '@/features/tournament'

const navItems = [
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/enter', label: 'Enter', icon: PenLine },
  { to: '/leaderboards', label: 'Leaders', icon: Trophy },
  { to: '/rounds', label: 'Rounds', icon: Flag },
  { to: '/players', label: 'Players', icon: Users },
] as const

export function AppShell() {
  const location = useLocation()
  const tournament = useTournamentStore((s) => s.activeTournament())
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Tournament header — shows active tournament name, links to /tournaments */}
      <header className="border-border border-b px-4 py-2">
        <div className="mx-auto flex max-w-lg items-center justify-between md:max-w-2xl">
          <Link
            to="/tournaments"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
          >
            {tournament ? tournament.name : 'No active tournament'}
            <ChevronRight className="size-3" aria-hidden="true" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() =>
              setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
            }
            aria-label="Toggle dark mode"
          >
            <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
          </Button>
        </div>
      </header>
      {/* Page content area — scrollable, with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        <div className="mx-auto w-full max-w-lg md:max-w-2xl">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <div
                key={location.pathname}
                className="animate-in fade-in duration-200"
              >
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav
        aria-label="Main navigation"
        className="bg-card border-border fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex max-w-lg items-center justify-around md:max-w-2xl">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
