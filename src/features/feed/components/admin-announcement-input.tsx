import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFeedStore } from '../state/feed-store'
import { Send } from 'lucide-react'

interface AdminAnnouncementInputProps {
  tournamentId: string
  userId: string
}

/**
 * Admin-only input for posting announcements to the feed.
 */
export function AdminAnnouncementInput({
  tournamentId,
  userId,
}: AdminAnnouncementInputProps) {
  const [message, setMessage] = useState('')
  const addAnnouncement = useFeedStore((s) => s.addAnnouncement)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    addAnnouncement({
      tournamentId,
      createdByUserId: userId,
      message: trimmed,
    })
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Post an announcement..."
        className="flex-1"
        aria-label="Announcement message"
      />
      <Button
        type="submit"
        size="sm"
        disabled={!message.trim()}
        className="gap-1.5"
      >
        <Send className="size-3.5" aria-hidden="true" />
        Post
      </Button>
    </form>
  )
}
