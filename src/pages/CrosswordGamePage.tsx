// @ts-nocheck
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { wordRepo } from '@/db/word-repo'
import { generateCrossword, CrosswordGridInfo, PlacedWord } from '@/utils/crossword'
import { Trophy, RefreshCw, ChevronRight, Gamepad2, ArrowRight, ZoomIn, ZoomOut, Trash2, Timer, Frown, Focus, Lightbulb, Eye } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useAudio } from '@/hooks/useAudio'

type CellPos = { x: number; y: number }

import { useCrosswordStore } from '@/stores/crossword-store'

function useGameSoundEffects() {
  const getContext = useCallback(() => {
    const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return null
    try {
      const ctx = new AudioCtor()
      if (ctx.state === 'suspended') ctx.resume()
      return ctx
    } catch {
      return null
    }
  }, [])

  const playNote = useCallback((freq: number, time: number, duration: number, type: OscillatorType = 'sine') => {
    const ctx = getContext()
    if (!ctx) return null
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, time)
    gain.gain.setValueAtTime(0.25, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + duration)
    return { osc, gain }
  }, [getContext])

  const playCorrect = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    playNote(523, now, 0.2)
    playNote(659, now + 0.15, 0.2)
  }, [getContext, playNote])

  const playWrong = useCallback(() => {
    const ctx = getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, now)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }, [getContext])

  return { playCorrect, playWrong }
}

export function CrosswordGamePage() {
  const {
    gameState, setGameState,
    wordCount, setWordCount,
    gridInfo, setGridInfo,
    userGrid, setUserGrid,
    selectedCell, setSelectedCell,
    activeDirection, setActiveDirection,
    timeLeft, setTimeLeft,
    wrongAttempts, setWrongAttempts,
    resetGame
  } = useCrosswordStore()

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null)
  
  const { speak } = useAudio()
  const { playCorrect, playWrong } = useGameSoundEffects()

  // Zoom & Pan
  const [zoom, setZoom] = useState(1)
  const constraintsRef = useRef<HTMLDivElement>(null)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track previous word status to detect changes for sound
  const prevStatusRef = useRef({ correct: [] as string[], incorrect: [] as string[] })

  // Setup game
  const startGame = async () => {
    const allWords = await wordRepo.getAll()
    if (allWords.length === 0) return

    const shuffled = [...allWords].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(wordCount, shuffled.length))

    const mapped = selected.map(w => ({
      id: w.id,
      word: w.word,
      clue: w.definitions[0]?.vietnamese || w.synonyms[0] || 'No clue'
    }))

    const info = generateCrossword(mapped, 100)
    
    if (info.placedWords.length === 0) {
      alert("Không thể tạo bảng chữ. Vui lòng thử lại!")
      return
    }

    setGridInfo(info)
    
    const emptyGrid = Array.from({ length: info.height }, () => Array(info.width).fill(''))
    setUserGrid(emptyGrid)

    if (info.placedWords.length > 0) {
      const firstWord = info.placedWords[0]
      setSelectedCell({ x: firstWord?.x as number, y: firstWord?.y as number })
      setActiveDirection(firstWord?.direction as any)
    }

    setTimeLeft(info.placedWords.length * 30)
    setWrongAttempts(0)
    setZoom(1)
    setPanPosition({ x: 0, y: 0 })
    setToast(null)
    prevStatusRef.current = { correct: [], incorrect: [] }
    setGameState('playing')
  }

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setGameState('timeout')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [gameState, timeLeft, setTimeLeft, setGameState])

  // Word statuses (correct / incorrect)
  const wordStatus = useMemo(() => {
    if (!gridInfo) return { correct: [], incorrect: [] }
    const correct: string[] = []
    const incorrect: string[] = []

    gridInfo.placedWords.forEach(w => {
      let filled = true
      let matched = true
      for (let i = 0; i < w.word.length; i++) {
        const cx = w.direction === 'across' ? w.x + i : w.x
        const cy = w.direction === 'across' ? w.y : w.y + i
        const userChar = userGrid[cy]?.[cx]
        if (!userChar) filled = false
        if (userChar !== w.word[i]) matched = false
      }
      if (filled && matched) correct.push(w.id)
      if (filled && !matched) incorrect.push(w.id)
    })
    return { correct, incorrect }
  }, [gridInfo, userGrid])

  // Play sound on status change
  useEffect(() => {
    if (gameState !== 'playing') return
    const prev = prevStatusRef.current
    const curr = wordStatus
    
    // Check if new correct word
    const newCorrect = curr.correct.filter(id => !prev.correct.includes(id))
    if (newCorrect.length > 0) {
      playCorrect()
      setToast({ message: 'Chính xác!', type: 'success' })
      setTimeout(() => setToast(null), 2500)
    } else {
      // Check if new incorrect word
      const newIncorrect = curr.incorrect.filter(id => !prev.incorrect.includes(id))
      if (newIncorrect.length > 0) {
        playWrong()
        setToast({ message: 'Sai rồi!', type: 'error' })
        setTimeout(() => setToast(null), 2500)
      }
    }
    
    prevStatusRef.current = curr
  }, [wordStatus, gameState, playCorrect, playWrong])

  const activeWord = useMemo(() => {
    if (!gridInfo || !selectedCell) return null
    return gridInfo.placedWords.find(w => {
      if (w.direction !== activeDirection) return false
      if (w.direction === 'across') {
        return w.y === selectedCell.y && selectedCell.x >= w.x && selectedCell.x < w.x + w.word.length
      } else {
        return w.x === selectedCell.x && selectedCell.y >= w.y && selectedCell.y < w.y + w.word.length
      }
    }) || null
  }, [gridInfo, selectedCell, activeDirection])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (gameState !== 'playing' || !selectedCell || !gridInfo) return

      const { x, y } = selectedCell

      if (/^[a-zA-Z]$/.test(e.key)) {
        const char = e.key.toUpperCase()
        const newGrid = [...userGrid]
        newGrid[y] = [...(newGrid[y] || [])]
        newGrid[y][x] = char
        setUserGrid(newGrid)
        
        // Track wrong attempt for individual cells
        if (gridInfo.grid[y][x] && gridInfo.grid[y][x] !== char) {
           setWrongAttempts(prev => {
             const newAttempts = prev + 1
             if (newAttempts >= 15) {
               setGameState('gameover')
             }
             return newAttempts
           })
        }
        
        checkCompletion(newGrid, gridInfo)

        if (activeDirection === 'across') {
          if (x + 1 < gridInfo.width && gridInfo.grid[y][x + 1] !== null) setSelectedCell({ x: x + 1, y })
        } else {
          if (y + 1 < gridInfo.height && gridInfo.grid[y + 1][x] !== null) setSelectedCell({ x, y: y + 1 })
        }
      }

      if (e.key === 'Backspace') {
        const newGrid = [...userGrid]
        newGrid[y] = [...(newGrid[y] || [])]
        
        if (newGrid[y][x] !== '') {
          newGrid[y][x] = ''
          setUserGrid(newGrid)
        } else {
          if (activeDirection === 'across') {
            if (x - 1 >= 0 && gridInfo.grid[y][x - 1] !== null) {
              newGrid[y][x - 1] = ''
              setUserGrid(newGrid)
              setSelectedCell({ x: x - 1, y })
            }
          } else {
            if (y - 1 >= 0 && gridInfo.grid[y - 1][x] !== null) {
              newGrid[y - 1][x] = ''
              setUserGrid(newGrid)
              setSelectedCell({ x, y: y - 1 })
            }
          }
        }
      }

      if (e.key === 'Delete' && activeWord) {
        const newGrid = [...userGrid]
        for (let i = 0; i < activeWord.word.length; i++) {
          const cx = activeWord.direction === 'across' ? activeWord.x + i : activeWord.x
          const cy = activeWord.direction === 'across' ? activeWord.y : activeWord.y + i
          newGrid[cy] = [...(newGrid[cy] || [])]
          newGrid[cy][cx] = ''
        }
        setUserGrid(newGrid)
        setSelectedCell({ x: activeWord.x, y: activeWord.y })
      }

      if (e.key === 'ArrowRight' && x + 1 < gridInfo.width && gridInfo.grid[y][x + 1] !== null) setSelectedCell({ x: x + 1, y })
      if (e.key === 'ArrowLeft' && x - 1 >= 0 && gridInfo.grid[y][x - 1] !== null) setSelectedCell({ x: x - 1, y })
      if (e.key === 'ArrowDown' && y + 1 < gridInfo.height && gridInfo.grid[y + 1][x] !== null) setSelectedCell({ x, y: y + 1 })
      if (e.key === 'ArrowUp' && y - 1 >= 0 && gridInfo.grid[y - 1][x] !== null) setSelectedCell({ x, y: y - 1 })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, selectedCell, activeDirection, gridInfo, userGrid, activeWord])

  const checkCompletion = (currentGrid: string[][], info: CrosswordGridInfo) => {
    let complete = true
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (info.grid[y][x] !== null) {
          if (currentGrid[y][x] !== info.grid[y][x]) {
            complete = false
            break
          }
        }
      }
      if (!complete) break
    }

    if (complete) {
      if (timerRef.current) clearInterval(timerRef.current)
      setGameState('completed')
      speak('Chúc mừng bạn đã hoàn thành')
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
      })
      
      const now = Date.now()
      const timeSpent = Math.max(1, (info.placedWords.length * 30 - timeLeft) * 1000)
      import('@/db/session-repo').then(({ sessionRepo }) => {
        sessionRepo.save({
          id: crypto.randomUUID(),
          mode: 'crossword',
          words: info.placedWords.map(w => w.id),
          results: info.placedWords.map(w => ({
            wordId: w.id,
            isCorrect: true,
            responseTime: timeSpent / info.placedWords.length,
            wasCloseCall: false,
            mode: 'crossword',
            timestamp: now
          })),
          startedAt: now - timeSpent,
          completedAt: now,
          totalTime: timeSpent
        })
      })
    }
  }

  const handleCellClick = (x: number, y: number) => {
    if (selectedCell?.x === x && selectedCell?.y === y) {
      setActiveDirection(prev => prev === 'across' ? 'down' : 'across')
    } else {
      setSelectedCell({ x, y })
      if (gridInfo) {
        const belongsToAcross = gridInfo.placedWords.some(w => w.direction === 'across' && y === w.y && x >= w.x && x < w.x + w.word.length)
        const belongsToDown = gridInfo.placedWords.some(w => w.direction === 'down' && x === w.x && y >= w.y && y < w.y + w.word.length)
        if (belongsToAcross && !belongsToDown) setActiveDirection('across')
        if (belongsToDown && !belongsToAcross) setActiveDirection('down')
      }
    }
  }

  // Auto-focus / Pan to word
  const handleClueClick = (w: PlacedWord, direction: 'across' | 'down') => {
    setSelectedCell({ x: w.x, y: w.y })
    setActiveDirection(direction)
    
    if (!gridInfo) return

    const maxContainerWidth = 800
    const maxContainerHeight = 800
    const widthConstraint = maxContainerWidth / gridInfo.width
    const heightConstraint = maxContainerHeight / gridInfo.height
    const currentCellSize = Math.min(45, Math.floor(Math.min(widthConstraint, heightConstraint)))

    const targetZoom = Math.max(1.5, zoom)
    setZoom(targetZoom)

    // Center coordinate of the word
    const cx = w.x + (direction === 'across' ? w.word.length / 2 : 0.5)
    const cy = w.y + (direction === 'down' ? w.word.length / 2 : 0.5)

    // Offset from the center of the grid
    const offsetX = (cx * currentCellSize) - (gridInfo.width * currentCellSize) / 2
    const offsetY = (cy * currentCellSize) - (gridInfo.height * currentCellSize) / 2

    // To center the word, we pan opposite to its scaled offset
    setPanPosition({ 
      x: -offsetX * targetZoom, 
      y: -offsetY * targetZoom 
    })
  }

  // Hints
  const handleHintRevealLetter = () => {
    if (!gridInfo || !selectedCell) return
    const { x, y } = selectedCell
    const correctChar = gridInfo.grid[y][x]
    if (correctChar) {
      const newGrid = [...userGrid]
      newGrid[y] = [...(newGrid[y] || [])]
      newGrid[y][x] = correctChar
      setUserGrid(newGrid)
      checkCompletion(newGrid, gridInfo)
    }
  }

  const handleHintRevealWord = () => {
    if (!gridInfo || !activeWord) return
    const newGrid = [...userGrid]
    for (let i = 0; i < activeWord.word.length; i++) {
      const cx = activeWord.direction === 'across' ? activeWord.x + i : activeWord.x
      const cy = activeWord.direction === 'across' ? activeWord.y : activeWord.y + i
      newGrid[cy] = [...(newGrid[cy] || [])]
      newGrid[cy][cx] = activeWord.word[i]
    }
    setUserGrid(newGrid)
    checkCompletion(newGrid, gridInfo)
  }

  const [showAnswers, setShowAnswers] = useState(false)

  const handleHintRevealBoard = () => {
    if (!gridInfo) return
    setShowAnswers(prev => !prev)
  }

  // Prevent default zoom on wheel in container and handle zoom
  useEffect(() => {
    const el = constraintsRef.current
    if (!el) return
    const listener = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        // Adjust zoom
        setZoom(z => {
          const newZoom = z - e.deltaY * 0.005
          return Math.max(0.5, Math.min(2.5, newZoom))
        })
      }
    }
    el.addEventListener('wheel', listener, { passive: false })
    return () => el.removeEventListener('wheel', listener)
  }, [])

  const acrossClues = gridInfo?.placedWords.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number) || []
  const downClues = gridInfo?.placedWords.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number) || []

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  let cellSize = 45
  if (gridInfo) {
    const maxContainerWidth = 800
    const maxContainerHeight = 800
    const widthConstraint = maxContainerWidth / gridInfo.width
    const heightConstraint = maxContainerHeight / gridInfo.height
    cellSize = Math.min(45, Math.floor(Math.min(widthConstraint, heightConstraint)))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-accent-500" /> Ô chữ (Crossword)
        </h2>
        
        {/* Timer & Mascot UI */}
        {(gameState === 'playing' || gameState === 'completed' || gameState === 'timeout') && (
          <div className="flex items-center gap-4">
            {/* Mascot moving around */}
            <motion.div 
              animate={{ 
                x: [-30, 30, -30],
                rotate: [-5, 5, -5]
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-4xl drop-shadow-md z-10"
            >
              🦉
            </motion.div>
            
            <div className={`px-4 py-2 rounded-xl font-mono text-2xl font-bold shadow-sm flex items-center gap-2 border-2 relative z-0 ${
              gameState === 'timeout' ? 'bg-red-50 text-red-500 border-red-200' :
              gameState === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
              timeLeft <= 60 ? 'bg-orange-50 text-orange-500 border-orange-200 animate-pulse' :
              'bg-white text-gray-800 border-gray-100'
            }`}>
              <Timer className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            <Button variant="ghost" onClick={() => setGameState('setup')} icon={<RefreshCw className="w-4 h-4" />}>
              Thoát
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-8 max-w-xl mx-auto text-center space-y-8">
              <div className="w-16 h-16 bg-accent-50 text-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <Gamepad2 className="w-8 h-8" />
                <motion.div 
                  className="absolute -top-4 -right-4 text-2xl"
                  animate={{ y: [0, -5, 0], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  🦉
                </motion.div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thử thách Ô chữ cùng Cú Mèo</h3>
                <p className="text-gray-500">
                  Hệ thống tự động ghép các từ vựng bạn đã học. Hãy điền kín bảng trước khi hết giờ nhé!
                </p>
              </div>

              <div className="space-y-4 text-left">
                <label className="block text-sm font-medium text-gray-700">Số lượng từ muốn ghép:</label>
                <div className="grid grid-cols-4 gap-3">
                  {[10, 15, 20, 30].map(num => (
                    <button
                      key={num}
                      onClick={() => setWordCount(num)}
                      className={`py-3 rounded-xl border-2 font-medium transition-all ${
                        wordCount === num
                          ? 'border-accent-500 bg-accent-50 text-accent-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {num} từ
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full h-14 text-lg"
                onClick={startGame}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Bắt đầu ngay
              </Button>
            </Card>
          </motion.div>
        )}

        {(gameState === 'playing' || gameState === 'completed' || gameState === 'timeout') && gridInfo && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-8 items-start"
          >
            {/* Grid Area with Custom Zoom/Pan */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <Button variant="ghost" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} icon={<ZoomOut className="w-4 h-4"/>} />
                    <span className="text-sm font-medium w-16 text-center text-gray-500">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button variant="ghost" onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} icon={<ZoomIn className="w-4 h-4"/>} />
                    <Button variant="ghost" onClick={() => { setZoom(1); setPanPosition({x:0,y:0}) }} icon={<Focus className="w-4 h-4"/>} title="Mặc định" />
                  </div>
                  
                  <div className="flex items-center gap-1 bg-amber-50 rounded-lg p-1 border border-amber-100">
                    <Button variant="ghost" className="text-amber-700 hover:bg-amber-100 text-xs" onClick={handleHintRevealLetter} icon={<Lightbulb className="w-4 h-4" />}>1 Chữ</Button>
                    <Button variant="ghost" className="text-amber-700 hover:bg-amber-100 text-xs" onClick={handleHintRevealWord} icon={<Lightbulb className="w-4 h-4" />}>1 Từ</Button>
                    <Button variant="ghost" className="text-amber-700 hover:bg-amber-100 text-xs" onClick={handleHintRevealBoard} icon={<Eye className="w-4 h-4" />}>
                      {showAnswers ? 'Ẩn đáp án' : 'Đáp án'}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-medium text-red-500 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                    <Frown className="w-4 h-4" /> Sai: {wrongAttempts}/15
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-red-600 hover:bg-red-50 text-xs"
                    onClick={() => {
                      if (activeWord) {
                        const newGrid = [...userGrid]
                        for (let i = 0; i < activeWord.word.length; i++) {
                          const cx = activeWord.direction === 'across' ? activeWord.x + i : activeWord.x
                          const cy = activeWord.direction === 'across' ? activeWord.y : activeWord.y + i
                          newGrid[cy] = [...(newGrid[cy] || [])]
                          newGrid[cy][cx] = ''
                        }
                        setUserGrid(newGrid)
                        setSelectedCell({ x: activeWord.x, y: activeWord.y })
                      }
                    }}
                    icon={<Trash2 className="w-4 h-4" />}
                    disabled={!activeWord}
                  >
                    Xóa từ (Del)
                  </Button>
                </div>
              </div>

              {/* Pan/Zoom Container */}
              <div 
                ref={constraintsRef}
                className="overflow-hidden bg-gray-50 p-0 rounded-2xl shadow-inner border border-gray-200 relative min-h-[600px] flex items-center justify-center cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  drag
                  dragConstraints={constraintsRef}
                  dragElastic={0.1}
                  animate={{ scale: zoom, x: panPosition.x, y: panPosition.y }}
                  onDragEnd={(e, info) => {
                    setPanPosition({ x: panPosition.x + info.offset.x, y: panPosition.y + info.offset.y })
                  }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="absolute"
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: `repeat(${gridInfo.width}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridInfo.height}, ${cellSize}px)`,
                    gap: '2px',
                    backgroundColor: '#cbd5e1', // grid border color
                    padding: '4px',
                    borderRadius: '8px'
                  }}
                >
                  {Array.from({ length: gridInfo.height }).map((_, y) => 
                    Array.from({ length: gridInfo.width }).map((_, x) => {
                      const isCell = gridInfo.grid[y]?.[x] !== null
                      const startingWord = gridInfo.placedWords.find(w => w.x === x && w.y === y)
                      const number = startingWord ? startingWord.number : null
                      const isSelected = selectedCell?.x === x && selectedCell?.y === y
                      
                      const isPartActive = activeWord && 
                        ((activeWord.direction === 'across' && y === activeWord.y && x >= activeWord.x && x < activeWord.x + activeWord.word.length) ||
                         (activeWord.direction === 'down' && x === activeWord.x && y >= activeWord.y && y < activeWord.y + activeWord.word.length))

                      const isPartCorrect = wordStatus.correct.some(id => {
                        const w = gridInfo.placedWords.find(pw => pw.id === id)
                        if(!w) return false
                        return (w.direction === 'across' && y === w.y && x >= w.x && x < w.x + w.word.length) ||
                               (w.direction === 'down' && x === w.x && y >= w.y && y < w.y + w.word.length)
                      })

                      const isPartIncorrect = wordStatus.incorrect.some(id => {
                        const w = gridInfo.placedWords.find(pw => pw.id === id)
                        if(!w) return false
                        return (w.direction === 'across' && y === w.y && x >= w.x && x < w.x + w.word.length) ||
                               (w.direction === 'down' && x === w.x && y >= w.y && y < w.y + w.word.length)
                      })

                      const userLetter = userGrid[y]?.[x] || ''
                      const displayLetter = (showAnswers && isCell) ? gridInfo.grid[y][x] : userLetter
                      const isCorrectCell = userLetter !== '' && userLetter === gridInfo.grid[y][x]
                      const isIncorrectCell = userLetter !== '' && userLetter !== gridInfo.grid[y][x]

                      return (
                        <div 
                          key={`${x}-${y}`} 
                          className={`relative flex items-center justify-center font-bold uppercase transition-colors select-none rounded-sm shadow-sm ${
                            isCell ? '' : 'opacity-0' 
                          }`}
                          style={{
                            backgroundColor: !isCell ? 'transparent' :
                                             isCorrectCell ? '#10b981' : // Green
                                             isIncorrectCell ? '#fee2e2' : // Red-100
                                             showAnswers ? '#e0f2fe' : // Light blue if showing answers
                                             isSelected ? 'var(--accent-200)' :
                                             isPartActive ? 'var(--accent-50)' :
                                             '#ffffff',
                            color: isCorrectCell ? '#ffffff' : 
                                   isIncorrectCell ? '#ef4444' :
                                   showAnswers && !isCorrectCell ? '#0369a1' : '#1f2937',
                            border: isSelected ? '3px solid var(--accent-600)' : 'none',
                            zIndex: isSelected ? 10 : 1
                          }}
                          onClick={(e) => {
                            if (isCell) {
                              e.stopPropagation() // Prevent dragging when clicking
                              handleCellClick(x, y)
                            }
                          }}
                        >
                          {isCell && number && (
                            <span className={`absolute top-0.5 left-1 text-[10px] font-normal ${isCorrectCell ? 'text-emerald-100' : isIncorrectCell ? 'text-red-400' : 'text-gray-400'}`}>
                              {number}
                            </span>
                          )}
                          <span style={{ fontSize: cellSize * 0.55 }}>
                            {isCell ? displayLetter : ''}
                          </span>
                        </div>
                      )
                    })
                  )}
                </motion.div>
              </div>
            </div>

            {/* Clues Area */}
            <div className="space-y-6">
              <Card className="p-5 h-[calc(100vh-200px)] flex flex-col">
                <h3 className="font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Gợi ý (Clues)</h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-6 scrollbar-thin">
                  <div>
                    <h4 className="font-semibold text-accent-600 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" /> Hàng ngang (Across)
                    </h4>
                    <ul className="space-y-2">
                      {acrossClues.map(w => {
                        const isCorrect = wordStatus.correct.includes(w.id)
                        const isIncorrect = wordStatus.incorrect.includes(w.id)
                        return (
                          <li 
                            key={w.id}
                            className={`text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                              activeWord?.id === w.id ? 'bg-accent-50 text-accent-900 font-medium border border-accent-200' : 
                              isCorrect ? 'bg-emerald-50 text-emerald-700 line-through opacity-70' :
                              isIncorrect ? 'bg-red-50 text-red-600' :
                              'text-gray-600 hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => handleClueClick(w, 'across')}
                          >
                            <span className="font-bold mr-2">{w.number}.</span>
                            {w.clue}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-accent-600 mb-3 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(90deg)' }}/> Hàng dọc (Down)
                    </h4>
                    <ul className="space-y-2">
                      {downClues.map(w => {
                        const isCorrect = wordStatus.correct.includes(w.id)
                        const isIncorrect = wordStatus.incorrect.includes(w.id)
                        return (
                          <li 
                            key={w.id}
                            className={`text-sm p-2 rounded-lg cursor-pointer transition-colors ${
                              activeWord?.id === w.id ? 'bg-accent-50 text-accent-900 font-medium border border-accent-200' : 
                              isCorrect ? 'bg-emerald-50 text-emerald-700 line-through opacity-70' :
                              isIncorrect ? 'bg-red-50 text-red-600' :
                              'text-gray-600 hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => handleClueClick(w, 'down')}
                          >
                            <span className="font-bold mr-2">{w.number}.</span>
                            {w.clue}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Time Out Modal */}
      <AnimatePresence>
        {gameState === 'timeout' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
              <Frown className="w-16 h-16 text-red-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Hết giờ!</h3>
                <p className="text-gray-500 mt-2">Cú Mèo buồn quá. Bạn thử lại nhé!</p>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setGameState('setup')}>
                Chơi lại
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-10 left-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
