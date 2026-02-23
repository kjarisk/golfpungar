import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { Toaster } from '@/components/ui/sonner'
import {
  FeedPage,
  EnterPage,
  LeaderboardsPage,
  RoundsPage,
  PlayersPage,
  BetsPage,
  TournamentsPage,
  NotFoundPage,
  LoginPage,
} from '@/pages'
import { AuthGuard } from '@/components/auth-guard'
import { seedDemoData, isDemoSeeded } from '@/lib/demo-data'

// Auto-seed demo data on first load so the app is never empty
if (!isDemoSeeded()) {
  seedDemoData()
}

function App() {
  return (
    <BrowserRouter basename="/golfpungar">
      <Routes>
        {/* Login — outside AppShell, no bottom nav */}
        <Route path="login" element={<LoginPage />} />

        {/* All app routes — protected by auth guard */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="enter" element={<EnterPage />} />
            <Route path="leaderboards" element={<LeaderboardsPage />} />
            <Route path="rounds" element={<RoundsPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="bets" element={<BetsPage />} />
            <Route path="tournaments" element={<TournamentsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  )
}

export default App
