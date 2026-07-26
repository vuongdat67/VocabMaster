// @ts-nocheck
// A simple heuristic-based crossword generator

export interface PlacedWord {
  id: string
  word: string
  clue: string
  x: number
  y: number
  direction: 'across' | 'down'
  number: number
}

export interface CrosswordGridInfo {
  grid: (string | null)[][]
  placedWords: PlacedWord[]
  width: number
  height: number
}

export function generateCrossword(
  words: { id: string; word: string; clue: string }[],
  maxAttempts: number = 50
): CrosswordGridInfo {
  // Clean up words (uppercase, remove spaces/hyphens for the grid)
  const cleanedWords = words.map(w => ({
    ...w,
    gridWord: w.word.toUpperCase().replace(/[^A-Z]/g, '')
  })).filter(w => w.gridWord.length > 0)

  // Sort by length descending
  cleanedWords.sort((a, b) => b.gridWord.length - a.gridWord.length)

  let bestGrid: CrosswordGridInfo | null = null
  let maxPlacedCount = 0

  // Try multiple times with random shuffling to get a better grid if we can't place all
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // For attempt > 0, slightly shuffle the words (except maybe the first one)
    const attemptWords = [...cleanedWords]
    if (attempt > 0) {
      const first = attemptWords.shift() as any
      for (let i = attemptWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[attemptWords[i], attemptWords[j]] = [attemptWords[j] as any, attemptWords[i] as any]
      }
      attemptWords.unshift(first)
    }

    const gridSize = 100 // Large arbitrary grid to start
    const grid: (string | null)[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
    const placed: PlacedWord[] = []

    for (const wordObj of attemptWords) {
      const gw = wordObj.gridWord
      if (placed.length === 0) {
        // Place first word in center
        const startX = Math.floor(gridSize / 2) - Math.floor(gw.length / 2)
        const startY = Math.floor(gridSize / 2)
        for (let i = 0; i < gw.length; i++) {
          grid[startY][startX + i] = (gw[i] as string)
        }
        placed.push({
          id: wordObj.id,
          word: gw,
          clue: wordObj.clue,
          x: startX,
          y: startY,
          direction: 'across',
          number: 0
        })
        continue
      }

      // Find all possible intersections
      let bestIntersection: { x: number, y: number, dir: 'across' | 'down', score: number } | null = null

      for (let i = 0; i < gw.length; i++) {
        const letter = (gw[i] as string)
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            if (grid[y][x] === letter) {
              // Try horizontal placement
              if (canPlaceWord(grid, gw, x - i, y, 'across', gridSize)) {
                const score = scorePlacement(grid, gw, x - i, y, 'across')
                if (!bestIntersection || score > bestIntersection.score) {
                  bestIntersection = { x: x - i, y, dir: 'across', score }
                }
              }
              // Try vertical placement
              if (canPlaceWord(grid, gw, x, y - i, 'down', gridSize)) {
                const score = scorePlacement(grid, gw, x, y - i, 'down')
                if (!bestIntersection || score > bestIntersection.score) {
                  bestIntersection = { x, y: y - i, dir: 'down', score }
                }
              }
            }
          }
        }
      }

      if (bestIntersection) {
        const { x, y, dir } = bestIntersection
        for (let i = 0; i < gw.length; i++) {
          if (dir === 'across') grid[y][x + i] = (gw[i] as string)
          else grid[y + i][x] = (gw[i] as string)
        }
        placed.push({
          id: wordObj.id,
          word: gw,
          clue: wordObj.clue,
          x,
          y,
          direction: dir,
          number: 0
        })
      }
    }

    if (placed.length > maxPlacedCount) {
      maxPlacedCount = placed.length
      bestGrid = { grid, placedWords: placed, width: 0, height: 0 }
    }
    if (maxPlacedCount === cleanedWords.length) {
      break // Placed all words
    }
  }

  // Trim the grid
  if (bestGrid) {
    let minX = 100, maxX = 0, minY = 100, maxY = 0
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        if (bestGrid.grid[y][x] !== null) {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    
    if (minX > maxX) {
      return { grid: [], placedWords: [], width: 0, height: 0 }
    }

    const width = maxX - minX + 1
    const height = maxY - minY + 1
    const trimmedGrid: (string | null)[][] = Array.from({ length: height }, () => Array(width).fill(null))
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        trimmedGrid[y - minY][x - minX] = bestGrid.grid[y][x]
      }
    }

    bestGrid.placedWords.forEach(w => {
      w.x -= minX
      w.y -= minY
    })

    bestGrid.placedWords.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

    let currentNumber = 1
    const assignedCoords = new Map<string, number>()
    
    bestGrid.placedWords.forEach(w => {
      const key = `${w.x},${w.y}`
      if (assignedCoords.has(key)) {
        w.number = assignedCoords.get(key)!
      } else {
        w.number = currentNumber
        assignedCoords.set(key, currentNumber)
        currentNumber++
      }
    })

    return { grid: trimmedGrid, placedWords: bestGrid.placedWords, width, height }
  }

  return { grid: [], placedWords: [], width: 0, height: 0 }
}

function canPlaceWord(grid: (string | null)[][], word: string, x: number, y: number, dir: 'across' | 'down', size: number): boolean {
  if (dir === 'across') {
    if (x < 0 || x + word.length > size) return false
    if (x > 0 && grid[y][x - 1] !== null) return false
    if (x + word.length < size && grid[y][x + word.length] !== null) return false

    for (let i = 0; i < word.length; i++) {
      const cx = x + i
      if (grid[y][cx] !== null && grid[y][cx] !== (word[i] as string)) return false
      if (grid[y][cx] === null) {
        if (y > 0 && grid[y - 1][cx] !== null) return false
        if (y < size - 1 && grid[y + 1][cx] !== null) return false
      }
    }
  } else {
    if (y < 0 || y + word.length > size) return false
    if (y > 0 && grid[y - 1][x] !== null) return false
    if (y + word.length < size && grid[y + word.length][x] !== null) return false

    for (let i = 0; i < word.length; i++) {
      const cy = y + i
      if (grid[cy][x] !== null && grid[cy][x] !== (word[i] as string)) return false
      if (grid[cy][x] === null) {
        if (x > 0 && grid[cy][x - 1] !== null) return false
        if (x < size - 1 && grid[cy][x + 1] !== null) return false
      }
    }
  }
  return true
}

function scorePlacement(grid: (string | null)[][], word: string, x: number, y: number, dir: 'across' | 'down'): number {
  let score = 0
  let intersections = 0
  for (let i = 0; i < word.length; i++) {
    const cx = dir === 'across' ? x + i : x
    const cy = dir === 'across' ? y : y + i
    if (grid[cy][cx] !== null) {
      intersections++
    }
  }
  score += intersections * 10
  return score
}
