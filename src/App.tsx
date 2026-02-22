import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from '@/components/app-shell'
import { Toaster } from '@/components/ui/sonner'
import {
  FeedPage,
  EnterPage,
  LeaderboardsPage,
  RoundsPage,
  PlayersPage,
  TournamentsPage,
} from '@/pages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<FeedPage />} />
          <Route path="enter" element={<EnterPage />} />
          <Route path="leaderboards" element={<LeaderboardsPage />} />
          <Route path="rounds" element={<RoundsPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="tournaments" element={<TournamentsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-center" richColors />
    </BrowserRouter>
  )
}

export default App
