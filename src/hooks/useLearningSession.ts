import { useCallback } from 'react'
import { useLearningStore } from '@/stores/learning-store'
import { useSettingsStore } from '@/stores/settings-store'
import type { SessionConfig } from '@/types/learning'
import type { AnswerResult } from '@/types/learning'

export function useLearningSession() {
  const store = useLearningStore()
  const { settings } = useSettingsStore()

  const startSession = useCallback(
    async (wordPool: string[]) => {
      const config: SessionConfig = {
        wordPool,
        order: settings.learningOrder,
        newWordsPerSession: settings.newWordsPerSession,
        maxReviewWords: settings.maxReviewWords,
        shuffleMode: settings.enableInterleaving ? 'interleave' : 'shuffle_all',
        enableInterleaving: settings.enableInterleaving,
      }
      await store.startSession(config)
    },
    [store, settings]
  )

  const submitAnswer = useCallback(
    (result: Omit<AnswerResult, 'timestamp'>) => {
      store.recordAnswer({ ...result, timestamp: Date.now() })

      if (result.isCorrect) {
        window.dispatchEvent(new CustomEvent('vocab:correct'))
      }
    },
    [store]
  )

  return {
    ...store,
    startSession,
    submitAnswer,
    startSessionLegacy: store.startSession,
  }
}
