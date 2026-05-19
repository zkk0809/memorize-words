-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Word lists (e.g., "CET-4", "TOEFL", custom user lists)
CREATE TABLE word_lists (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  language    TEXT DEFAULT 'en',
  target_lang TEXT DEFAULT 'zh',
  is_public   BOOLEAN DEFAULT true,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Individual words
CREATE TABLE words (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id     UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  word        TEXT NOT NULL,
  pronunciation TEXT DEFAULT '',
  definition  TEXT NOT NULL,
  example     TEXT DEFAULT '',
  example_translation TEXT DEFAULT '',
  pos         TEXT DEFAULT '',
  difficulty  INTEGER DEFAULT 0,
  audio_url   TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  UNIQUE(list_id, word)
);

-- Learning progress per word per user (SM-2 tracking)
CREATE TABLE user_progress (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id       UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  list_id       UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
  easiness_factor  REAL DEFAULT 2.5,
  repetition       INTEGER DEFAULT 0,
  interval         INTEGER DEFAULT 0,
  next_review      DATE DEFAULT now(),
  last_reviewed    TIMESTAMPTZ,
  last_grade      INTEGER DEFAULT NULL,
  status          TEXT DEFAULT 'new',
  total_reviews   INTEGER DEFAULT 0,
  correct_count   INTEGER DEFAULT 0,
  wrong_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word_id)
);

-- Review sessions
CREATE TABLE review_sessions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id       UUID REFERENCES word_lists(id),
  session_type  TEXT NOT NULL,
  started_at    TIMESTAMPTZ DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  words_count   INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0
);

-- Individual review records
CREATE TABLE review_records (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id    UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id       UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  grade         INTEGER NOT NULL,
  time_ms       INTEGER DEFAULT 0,
  answered_at   TIMESTAMPTZ DEFAULT now()
);

-- User settings
CREATE TABLE user_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_new_limit    INTEGER DEFAULT 20,
  daily_review_limit INTEGER DEFAULT 50,
  preferred_list     UUID REFERENCES word_lists(id),
  auto_pronounce     BOOLEAN DEFAULT false,
  theme              TEXT DEFAULT 'light',
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_words_list_id ON words(list_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_user_list ON user_progress(user_id, list_id);
CREATE INDEX idx_user_progress_next_review ON user_progress(user_id, next_review) WHERE status IN ('learning', 'reviewing');
CREATE INDEX idx_user_progress_status ON user_progress(user_id, status);
CREATE INDEX idx_review_sessions_user ON review_sessions(user_id);
CREATE INDEX idx_review_records_session ON review_records(session_id);

-- Row Level Security
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Public lists readable by all
CREATE POLICY "Public lists readable by all"
  ON word_lists FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users read own lists"
  ON word_lists FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users create own lists"
  ON word_lists FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users update own lists"
  ON word_lists FOR UPDATE
  USING (created_by = auth.uid());

-- Words: anyone can read public list words
CREATE POLICY "Public words readable"
  ON words FOR SELECT
  USING (EXISTS (SELECT 1 FROM word_lists WHERE word_lists.id = words.list_id AND word_lists.is_public = true));

CREATE POLICY "Users read own list words"
  ON words FOR SELECT
  USING (EXISTS (SELECT 1 FROM word_lists WHERE word_lists.id = words.list_id AND word_lists.created_by = auth.uid()));

CREATE POLICY "Users insert own list words"
  ON words FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM word_lists WHERE word_lists.id = words.list_id AND word_lists.created_by = auth.uid()));

-- User progress: own records only
CREATE POLICY "Users read own progress"
  ON user_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own progress"
  ON user_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own progress"
  ON user_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Review sessions/records: own records only
CREATE POLICY "Users read own sessions"
  ON review_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own sessions"
  ON review_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own sessions"
  ON review_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users read own review records"
  ON review_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own review records"
  ON review_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User settings: own record only
CREATE POLICY "Users read own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());