
CREATE TABLE public.study_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'primary',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.study_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view study modules"
ON public.study_modules FOR SELECT USING (true);

CREATE POLICY "Admins can insert study modules"
ON public.study_modules FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update study modules"
ON public.study_modules FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete study modules"
ON public.study_modules FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_study_modules_updated_at
BEFORE UPDATE ON public.study_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
