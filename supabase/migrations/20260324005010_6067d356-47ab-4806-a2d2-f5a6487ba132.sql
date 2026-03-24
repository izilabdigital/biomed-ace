
-- Add unique friend_code to profiles
ALTER TABLE public.profiles ADD COLUMN friend_code text UNIQUE;

-- Generate codes for existing profiles
UPDATE public.profiles
SET friend_code = LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0')
WHERE friend_code IS NULL;

-- Make it not null with a default
ALTER TABLE public.profiles ALTER COLUMN friend_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN friend_code SET DEFAULT LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');

-- Function to generate unique friend code on new profile
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  IF NEW.friend_code IS NULL OR NEW.friend_code = '' THEN
    LOOP
      new_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE friend_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.friend_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_friend_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_friend_code();
