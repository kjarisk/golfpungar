import { useState } from 'react'
import { Navigate } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/state/auth-store'
import { toast } from 'sonner'

/**
 * Golf-themed magic-link login page.
 * Inspired by the Greensbook screenshot — clean, centered, green gradient.
 *
 * In dev mode the user is auto-logged-in so this page redirects immediately.
 * When Supabase is connected, this will call supabase.auth.signInWithOtp().
 */
export function LoginPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  // If already logged in, redirect to feed
  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSending(true)

    // Mock magic link — in production this calls Supabase signInWithOtp
    setTimeout(() => {
      setIsSending(false)
      setIsSent(true)
      toast.success('Magic link sent! Check your email.')
    }, 1200)
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden">
      {/* Green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-100 via-green-50 to-green-200 dark:from-green-950 dark:via-green-900/50 dark:to-green-950" />

      {/* Golf course silhouette at bottom */}
      <div className="absolute inset-x-0 bottom-0">
        <svg
          viewBox="0 0 1440 320"
          className="w-full text-green-600/20 dark:text-green-400/10"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,133.3C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-green-600/20 dark:bg-green-400/10" />
      </div>

      {/* Second hill layer */}
      <div className="absolute inset-x-0 bottom-0">
        <svg
          viewBox="0 0 1440 200"
          className="w-full text-green-700/15 dark:text-green-500/8"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,160L60,149.3C120,139,240,117,360,122.7C480,128,600,160,720,154.7C840,149,960,107,1080,96C1200,85,1320,107,1380,117.3L1440,128L1440,200L1380,200C1320,200,1200,200,1080,200C960,200,840,200,720,200C600,200,480,200,360,200C240,200,120,200,60,200L0,200Z"
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-green-700/15 dark:bg-green-500/8" />
      </div>

      {/* Flag on the "hill" */}
      <div className="absolute bottom-24 right-1/4">
        <div className="flex flex-col items-center">
          <div className="h-2 w-5 rounded-sm bg-red-500/60" />
          <div className="h-16 w-0.5 bg-gray-400/50" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="size-20 drop-shadow-lg"
          >
            <rect width="512" height="512" rx="96" fill="#16a34a" />
            <circle cx="256" cy="220" r="60" fill="white" />
            <path d="M256 280 L240 400 L256 380 L272 400 Z" fill="white" />
            <path
              d="M180 160 C180 160 200 100 256 80 C312 100 332 160 332 160"
              stroke="white"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* App name */}
        <h1 className="mb-12 text-3xl font-bold tracking-tight text-green-900 dark:text-green-100">
          Golfpungar
        </h1>

        {/* Login card */}
        <div className="w-full rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/80">
          {isSent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <Mail className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Check your email
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a magic link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                <br />
                Click the link to sign in.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setIsSent(false)
                  setEmail('')
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with your email to continue
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                  className="bg-white dark:bg-gray-800"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSending}
                className="w-full text-base font-semibold"
              >
                {isSending ? 'Sending link…' : 'Log in'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Invite only — ask your tournament admin for access
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
