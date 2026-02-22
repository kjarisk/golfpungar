import { Outlet, NavLink } from 'react-router'
import { Newspaper, PenLine, Trophy, Flag, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/feed', label: 'Feed', icon: Newspaper },
  { to: '/enter', label: 'Enter', icon: PenLine },
  { to: '/leaderboards', label: 'Leaders', icon: Trophy },
  { to: '/rounds', label: 'Rounds', icon: Flag },
  { to: '/players', label: 'Players', icon: Users },
] as const

export function AppShell() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      {/* Page content area — scrollable, with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20">
        <div className="mx-auto w-full max-w-lg">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="bg-card border-border fixed inset-x-0 bottom-0 z-50 border-t">
        <div className="mx-auto flex max-w-lg items-center justify-around">
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
              <Icon className="size-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
