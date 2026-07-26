-- 1. Xóa bảng cũ nếu có (cẩn thận nếu bạn đang dùng chung Supabase với project khác)
-- DROP TABLE IF EXISTS public.weekly_activity;
-- DROP TABLE IF EXISTS public.stats;
-- DROP TABLE IF EXISTS public.settings;
-- DROP TABLE IF EXISTS public.word_packs;
-- DROP TABLE IF EXISTS public.sessions;
-- DROP TABLE IF EXISTS public.srs_data;
-- DROP TABLE IF EXISTS public.words;

-- 2. Bảng Words (Từ vựng)
CREATE TABLE public.words (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    ipa TEXT,
    part_of_speech TEXT,
    definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
    antonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    audio_url TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    difficulty SMALLINT NOT NULL DEFAULT 1,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 3. Bảng SRS Data (Dữ liệu học thuật toán Lặp lại ngắt quãng)
CREATE TABLE public.srs_data (
    word_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    interval INTEGER NOT NULL,
    ease_factor REAL NOT NULL,
    repetitions INTEGER NOT NULL,
    next_review_at BIGINT NOT NULL,
    average_response_time REAL NOT NULL,
    last_response_time REAL NOT NULL,
    times_correct INTEGER NOT NULL,
    times_wrong INTEGER NOT NULL,
    close_calls INTEGER NOT NULL,
    studied_in_sessions INTEGER NOT NULL,
    last_studied_at BIGINT NOT NULL,
    mode_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    wrong_modes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

-- 4. Bảng Sessions (Lịch sử phiên học)
CREATE TABLE public.sessions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    words JSONB NOT NULL DEFAULT '[]'::jsonb,
    results JSONB NOT NULL DEFAULT '[]'::jsonb,
    started_at BIGINT NOT NULL,
    completed_at BIGINT,
    total_time INTEGER NOT NULL
);

-- 5. Bảng Settings (Cài đặt người dùng)
CREATE TABLE public.settings (
    key TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value JSONB,
    PRIMARY KEY (user_id, key)
);

-- 6. Bảng Stats (Thống kê người dùng)
CREATE TABLE public.stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_words_learned INTEGER NOT NULL,
    words_mastered INTEGER NOT NULL,
    total_reviews INTEGER NOT NULL,
    current_streak INTEGER NOT NULL,
    max_streak INTEGER NOT NULL,
    last_study_date TEXT NOT NULL,
    total_time_spent BIGINT NOT NULL,
    accuracy REAL NOT NULL
);

-- 7. Bảng Weekly Activity (Hoạt động tuần)
CREATE TABLE public.weekly_activity (
    date TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    words_reviewed INTEGER NOT NULL,
    time_spent INTEGER NOT NULL,
    PRIMARY KEY (user_id, date)
);

-- ==========================================
-- BẢO MẬT: Bật Row Level Security (RLS)
-- Chỉ cho phép user xem/sửa dữ liệu của chính họ
-- ==========================================

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_activity ENABLE ROW LEVEL SECURITY;

-- Tạo Policies
DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN SELECT unnest(ARRAY['words', 'srs_data', 'sessions', 'settings', 'stats', 'weekly_activity'])
    LOOP
        EXECUTE format('
            CREATE POLICY "Users can view own %I" ON public.%I FOR SELECT USING (auth.uid() = user_id);
            CREATE POLICY "Users can insert own %I" ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id);
            CREATE POLICY "Users can update own %I" ON public.%I FOR UPDATE USING (auth.uid() = user_id);
            CREATE POLICY "Users can delete own %I" ON public.%I FOR DELETE USING (auth.uid() = user_id);
        ', t_name, t_name, t_name, t_name, t_name, t_name, t_name, t_name);
    END LOOP;
END
$$;
