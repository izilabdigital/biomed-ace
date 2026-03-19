
ALTER TABLE public.card_progress 
  ADD COLUMN IF NOT EXISTS easiness_factor real NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repetitions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review_at timestamp with time zone NOT NULL DEFAULT now();
