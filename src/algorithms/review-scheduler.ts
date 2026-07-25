import { progressRepo } from '@/db/progress-repo'
import { db } from '@/db/database'

export async function getReviewCount(): Promise<number> {
  return progressRepo.getDueCount()
}

export function getNextReviewTime(): number {
  const now = Date.now()
  // Remind after 6 hours of inactivity (or configured)
  return now + 6 * 60 * 60 * 1000
}

export async function checkStreak(): Promise<{
  current: number
  longest: number
  active: boolean
}> {
  const sessions = await db.sessions
    .orderBy('startedAt')
    .reverse()
    .toArray()

  if (sessions.length === 0) {
    return { current: 0, longest: 0, active: false }
  }

  const days = new Set<string>()
  sessions.forEach((s) => {
    const d = new Date(s.startedAt).toISOString().slice(0, 10)
    days.add(d)
  })

  const sortedDays = Array.from(days).sort().reverse()
  let current = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

  // Check if studied today or yesterday to count streak
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return { current: 0, longest: calculateLongest(sortedDays), active: false }
  }

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      current = 1
      continue
    }
    const prev = new Date(sortedDays[i - 1]!).getTime()
    const curr = new Date(sortedDays[i]!).getTime()
    const diffDays = Math.round((prev - curr) / 86_400_000)
    if (diffDays === 1) {
      current++
    } else {
      break
    }
  }

  return { current, longest: Math.max(current, calculateLongest(sortedDays)), active: current > 0 }
}

function calculateLongest(days: string[]): number {
  if (days.length === 0) return 0
  let longest = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]!).getTime()
    const curr = new Date(days[i]!).getTime()
    if (Math.round((prev - curr) / 86_400_000) === 1) {
      run++
      longest = Math.max(longest, run)
    } else {
      run = 1
    }
  }
  return longest
}
