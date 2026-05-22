import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateAnnouncement } from '../api/use-announcements'
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
  const createAnnouncement = useCreateAnnouncement()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    try {
      await createAnnouncement.mutateAsync({
        tournamentId,
        createdByUserId: userId,
        message: trimmed,
      })
      setMessage('')
    } catch {
      toast.error('Could not post announcement')
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex items-center gap-2"
    >
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Post an announcement..."
        className="h-11 flex-1"
        aria-label="Announcement message"
      />
      <Button
        type="submit"
        disabled={!message.trim() || createAnnouncement.isPending}
        className="h-11 gap-1.5"
      >
        <Send className="size-4" aria-hidden="true" />
        Post
      </Button>
    </form>
  )
}
