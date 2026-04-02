
-- Table for AI-generated quiz/exam questions
CREATE TABLE public.dynamic_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module text NOT NULL,
  module_color text NOT NULL DEFAULT 'primary',
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  explanation text,
  question_type text NOT NULL DEFAULT 'quiz',
  difficulty text NOT NULL DEFAULT 'medium',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dynamic_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view dynamic questions"
  ON public.dynamic_questions FOR SELECT USING (true);

CREATE POLICY "Admins can insert dynamic questions"
  ON public.dynamic_questions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dynamic questions"
  ON public.dynamic_questions FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dynamic questions"
  ON public.dynamic_questions FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Table for word search words
CREATE TABLE public.word_search_words (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module text NOT NULL,
  module_color text NOT NULL DEFAULT 'primary',
  word text NOT NULL,
  explanation text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.word_search_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view word search words"
  ON public.word_search_words FOR SELECT USING (true);

CREATE POLICY "Admins can insert word search words"
  ON public.word_search_words FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete word search words"
  ON public.word_search_words FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
