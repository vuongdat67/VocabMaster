import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, CheckCircle2, Play, Square, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useSoundEffects } from '@/hooks/useSoundEffects'

interface TranscriptLine {
  id: number
  startTime: number
  text: string
  translation: string
}

const SAMPLE_VIDEO = {
  id: 'cmrd1wzej0017ju5b2cfuemra', // mock id
  title: 'Early Learning Stories | Feelings and Emotions',
  youtubeId: 'dQw4w9WgXcQ', // Just a placeholder, replace with a real kid song if possible
  transcript: [
    { id: 1, startTime: 2, text: "little fox.", translation: "con cáo nhỏ." },
    { id: 2, startTime: 7, text: "teddy's day.", translation: "Ngày của Teddy." },
    { id: 3, startTime: 13, text: "Teddy is happy.", translation: "Teddy đang vui." },
    { id: 4, startTime: 27, text: "Teddy is angry.", translation: "Teddy đang giận." },
    { id: 5, startTime: 40, text: "Teddy is sad.", translation: "Teddy đang buồn." },
    { id: 6, startTime: 51, text: "Teddy is thirsty.", translation: "Teddy đang khát." },
    { id: 7, startTime: 54, text: "I want water.", translation: "Tôi muốn nước." },
  ] as TranscriptLine[]
}

export function ShadowingGamePage() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [score, setScore] = useState(0)
  const { playCorrect, playWrong } = useSoundEffects()

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          setRecognizedText(finalTranscript)
          checkPronunciation(finalTranscript)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }
  }, [currentLineIndex])

  const checkPronunciation = (spokenText: string) => {
    const targetText = SAMPLE_VIDEO.transcript[currentLineIndex]?.text || ''
    
    // Simple word matching logic
    const sanitize = (s: string) => s.toLowerCase().replace(/[.,!?'"]/g, '').trim()
    const spokenWords = sanitize(spokenText).split(' ')
    const targetWords = sanitize(targetText).split(' ')
    
    const matchCount = targetWords.filter(w => spokenWords.includes(w)).length
    const matchRate = matchCount / targetWords.length

    if (matchRate >= 0.7) {
      playCorrect()
      setScore(s => s + 1)
      setTimeout(() => {
        if (currentLineIndex < SAMPLE_VIDEO.transcript.length - 1) {
          setCurrentLineIndex(i => i + 1)
          setRecognizedText('')
        }
      }, 1500)
    } else {
      playWrong()
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      setRecognizedText('')
      try {
        recognitionRef.current?.start()
        setIsRecording(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Video Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Video className="w-6 h-6 text-red-500" />
          {SAMPLE_VIDEO.title}
        </h1>
        
        <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden relative shadow-lg border-4 border-white">
          <iframe 
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${SAMPLE_VIDEO.youtubeId}?rel=0&showinfo=0`}
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Transcript Section */}
      <Card className="flex flex-col h-[600px] overflow-hidden bg-white/80 backdrop-blur-md">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 flex justify-between items-center">
          <span className="font-bold text-gray-600">Transcript ({SAMPLE_VIDEO.transcript.length} câu)</span>
          <div className="flex items-center gap-2 text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-4 h-4" /> Score: {score}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {SAMPLE_VIDEO.transcript.map((line, idx) => (
            <div 
              key={line.id} 
              className={`p-4 rounded-2xl transition-all border-2 ${
                idx === currentLineIndex 
                  ? 'border-blue-400 bg-blue-50 shadow-md transform scale-[1.02]' 
                  : 'border-transparent hover:bg-gray-50 opacity-60'
              }`}
            >
              <div className="flex gap-4">
                <span className="text-sm font-bold text-gray-400 shrink-0">
                  0:{line.startTime.toString().padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className={`font-bold ${idx === currentLineIndex ? 'text-blue-900 text-lg' : 'text-gray-700'}`}>
                    {line.text}
                  </p>
                  <p className="text-gray-500 mt-1 border-l-2 border-green-400 pl-3">
                    Dịch: {line.translation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recording Controls */}
        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-gray-500 h-6">
              {recognizedText ? `Bạn nói: "${recognizedText}"` : (isRecording ? "Đang nghe..." : "Bấm nút Micro và đọc câu đang chọn")}
            </p>
            <button
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white scale-110' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
