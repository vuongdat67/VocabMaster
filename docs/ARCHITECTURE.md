# Vocab Master — Architecture Overview

## 🧱 Stack

```
React 19 + TypeScript  + Vite 6
Tailwind CSS 4          Framer Motion 11
Dexie.js 4 (IndexedDB)  Zustand 5
Recharts                Lucide React
Web Audio API           React Router 7
```

## 📁 Cấu trúc

```
src/
├── algorithms/       # SRS, session engine, review scheduler
│   ├── srs.ts             # Forgetting-curve + SM-2 hybrid
│   ├── session-engine.ts  # Learning wheel — 3 queues, priority, interleave
│   ├── session-planner.ts # Legacy (deprecated)
│   ├── review-scheduler.ts# Streak tracking
│   └── forgetting-curve.ts# Exponential forgetting curve
│
├── components/
│   ├── layout/       # AppShell, Sidebar, Header
│   ├── mascot/       # Draggable mascot widget
│   ├── effects/      # Celebration, wind chime, particles
│   └── ui/           # Card, Button, Badge, ProgressBar
│
├── data/
│   └── themes.ts     # 10 theme presets (Zinc → Sunset)
│
├── db/
│   ├── database.ts   # Dexie schema (words, srsData, sessions, ...)
│   ├── word-repo.ts  # Word CRUD
│   └── progress-repo.ts # SRS + stats queries
│
├── features/         # 7 learning modes + 2 games
│   ├── flashcards/
│   ├── audio-challenge/
│   ├── text-challenge/
│   ├── typing-challenge/
│   ├── fill-blank/
│   ├── matching/
│   │   ├── MatchingSession.tsx     # In-learning matching
│   │   └── MatchingGame.tsx        # Standalone game
│   ├── synonym-match/
│   ├── jumble/              # Letter jumble
│   └── listening-challenge/ # Listen & type
│
├── hooks/
│   ├── useAudio.ts
│   └── useLearningSession.ts
│
├── lib/
│   ├── audio-utils.ts     # Correct/wrong/click sounds
│   ├── sound-manager.ts   # Wind chime, ambient
│   ├── distractors.ts     # Smart distractor engine
│   └── image-search.ts    # Unsplash integration
│
├── pages/
│   ├── HomePage.tsx           # Dashboard
│   ├── WordListPage.tsx       # Word browser + edit/delete
│   ├── WordDetailPage.tsx     # Word detail + inline edit
│   ├── LearningSessionPage.tsx # Core learning flow
│   ├── ReviewPage.tsx         # Due-word review
│   ├── StatsPage.tsx          # Statistics charts
│   ├── ImportPage.tsx         # CSV/JSON/manual import
│   ├── SettingsPage.tsx       # Theme, sound, learning config
│   └── WindPage.tsx           # Vocabulary bubble garden
│
├── stores/
│   ├── learning-store.ts # Session state + wheel engine
│   ├── settings-store.ts # User preferences (persisted)
│   ├── avatar-store.ts   # Dashboard avatar (persisted)
│   └── ui-store.ts       # Sidebar, mobile state
│
└── types/
    ├── word.ts        # Word, Definition, Example, WordPack
    ├── learning.ts    # SRSData, AnswerResult, SessionConfig
    ├── settings.ts    # UserSettings, ThemeMode, ThemeColor
    └── stats.ts       # UserStats, WeeklyActivity
```

## 🔄 Luồng học

```
LIST → FLASHCARD → MODE_LOOP (randomized 7 modes) → MASTERY → REVIEWS pool
```

Chi tiết: [LEARNING_FLOW.md](LEARNING_FLOW.md)

## 🎨 Theme System

10 presets, mỗi preset có light + dark variant. Chi tiết: [THEMES.md](THEMES.md)

## ☁️ Deploy

GitHub Pages + Cloudflare Pages (dual). Chi tiết: [DEPLOY.md](DEPLOY.md)
