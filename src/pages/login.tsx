import { useState } from 'react'
import { Navigate } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/state/auth-store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

/**
 * Golf-themed magic-link login page.
 * Inspired by the Greensbook screenshot — clean, centered, green gradient.
 *
 * Calls supabase.auth.signInWithOtp() to email a magic link; clicking it
 * redirects back here, where the auth listener picks up the new session.
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSending(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin },
    })
    setIsSending(false)

    if (error) {
      toast.error(error.message)
      return
    }
    setIsSent(true)
    toast.success('Magic link sent! Check your email.')
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

      {/* Pin, cup, and ball on the back hill */}
      <div className="absolute right-1/4 bottom-24 select-none">
        <div className="relative">
          {/* Pole */}
          <div className="h-24 w-[2px] bg-white/75 shadow-sm dark:bg-white/65" />
          {/* Triangular pennant with hole number — gently waves */}
          <div
            className="animate-flag-wave absolute top-0 left-[2px] h-4 w-10 bg-red-500 drop-shadow-md dark:bg-red-500/90"
            style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
          >
            <span className="absolute top-1/2 left-[3px] -translate-y-1/2 text-[9px] font-bold leading-none tracking-tight text-white/95">
              18
            </span>
          </div>
          {/* Cup (the hole) at the base */}
          <div className="absolute -bottom-[3px] left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-black/45" />
          {/* Putting line — dots brighten in sequence ball → cup so the eye
              reads the putt as rolling toward the hole. */}
          <div className="absolute bottom-0 -left-[40px] flex items-center gap-[5px]">
            <div
              className="animate-putt-chase size-[2px] rounded-full bg-white"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="animate-putt-chase size-[2px] rounded-full bg-white"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="animate-putt-chase size-[2px] rounded-full bg-white"
              style={{ animationDelay: '300ms' }}
            />
            <div
              className="animate-putt-chase size-[2px] rounded-full bg-white"
              style={{ animationDelay: '450ms' }}
            />
          </div>
          {/* Golf ball — about to roll in */}
          <div className="absolute -bottom-[1px] -left-14 size-2.5 rounded-full bg-white shadow-md ring-1 ring-black/10" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-3">
          {/* Logo: two golf balls — a quiet nod to "pungar" (Icelandic: balls) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="size-20 drop-shadow-lg"
            aria-label="Golfpungar logo"
          >
            <rect width="512" height="512" rx="96" fill="#16a34a" />
            {/* Soft turf shadows under each ball */}
            <ellipse
              cx="162"
              cy="384"
              rx="74"
              ry="10"
              fill="rgba(0,0,0,0.22)"
            />
            <ellipse
              cx="350"
              cy="384"
              rx="74"
              ry="10"
              fill="rgba(0,0,0,0.22)"
            />
            {/* The pungar */}
            <circle cx="162" cy="290" r="88" fill="white" />
            <circle cx="350" cy="290" r="88" fill="white" />
            {/* Alignment marks — the classic putting-line stripe */}
            <line
              x1="98"
              y1="290"
              x2="226"
              y2="290"
              stroke="rgba(0,0,0,0.16)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <line
              x1="286"
              y1="290"
              x2="414"
              y2="290"
              stroke="rgba(0,0,0,0.16)"
              strokeWidth="6"
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
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="flex flex-col gap-4"
            >
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
