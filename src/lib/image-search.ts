/**
 * Image search service for vocabulary words.
 * Uses Unsplash API for high-quality photos.
 *
 * Setup: Copy .env.example to .env and fill in your Unsplash keys
 *   VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
 */

const UNSPLASH_BASE = 'https://api.unsplash.com'

interface UnsplashResult {
  urls: { regular: string; thumb: string; small: string }
  user: { name: string; links: { html: string } }
  id: string
}

let cachedKey: string | null = null
let useFallbackMode = false

export function getUnsplashAccessKey(): string | null {
  if (cachedKey) return cachedKey
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined
  if (key) cachedKey = key
  return cachedKey
}

export function isUnsplashConfigured(): boolean {
  return !!getUnsplashAccessKey()
}

async function fetchFromUnsplash(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const key = getUnsplashAccessKey()
  if (!key) throw new Error('Unsplash Access Key not configured')

  const query = new URLSearchParams({ ...params, per_page: '3' }).toString()
  const res = await fetch(`${UNSPLASH_BASE}${endpoint}?${query}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
      'Accept-Version': 'v1',
    },
  })

  if (res.status === 403) {
    useFallbackMode = true
    throw new Error('Unsplash rate limit hit, switching to fallback')
  }
  if (!res.ok) throw new Error(`Unsplash error: ${res.status}`)

  return res.json()
}

/** Search Unsplash for a word/phrase */
export async function searchUnsplash(query: string): Promise<string[]> {
  try {
    const data = await fetchFromUnsplash('/search/photos', { query, per_page: '3' })
    if (data.results?.length > 0) {
      return data.results.map((r: UnsplashResult) => r.urls.small)
    }
  } catch (e) {
    console.warn('[image-search]', e)
  }
  return []
}

/** Generate a colored placeholder when no real image available */
export function generatePlaceholder(word: string, size = 400): string {
  const colors = [
    '6366f1', '8b5cf6', 'a78bfa', '818cf8',
    '3b82f6', '10b981', 'f59e0b', 'f43f5e',
    '06b6d4', '84cc16', 'ec4899', '14b8a6',
  ]
  const idx = word.length % colors.length
  const color = colors[idx] ?? '6366f1'
  return `https://placehold.co/${size}x${size}/${color}/white?text=${encodeURIComponent(word[0]?.toUpperCase() ?? '?')}`
}

/** Get the best available image for a word */
export async function getImageForWord(word: string): Promise<string> {
  if (!useFallbackMode && isUnsplashConfigured()) {
    const results = await searchUnsplash(word)
    if (results.length > 0) return results[0]!
  }
  // No Unsplash key: use DiceBear API (free, no key required)
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(word)}&backgroundColor=6366f1&textColor=ffffff`
}

/** Batch-fetch images for many words, with concurrency control */
export async function batchFetchImages(
  words: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const total = words.length
  let done = 0

  // Process sequentially to avoid rate limits
  for (const word of words) {
    const url = await getImageForWord(word)
    results.set(word, url)
    done++
    onProgress?.(done, total)
    // Small delay to avoid rate limiting
    if (isUnsplashConfigured() && done < total) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return results
}
