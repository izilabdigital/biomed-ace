
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Dynamic flashcards table
CREATE TABLE public.dynamic_flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  module_color text NOT NULL DEFAULT 'primary',
  front text NOT NULL,
  back text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.dynamic_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view dynamic flashcards"
ON public.dynamic_flashcards FOR SELECT
USING (true);

CREATE POLICY "Admins can insert dynamic flashcards"
ON public.dynamic_flashcards FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dynamic flashcards"
ON public.dynamic_flashcards FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dynamic flashcards"
ON public.dynamic_flashcards FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dynamic_flashcards_updated_at
BEFORE UPDATE ON public.dynamic_flashcards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Content uploads tracking
CREATE TABLE public.content_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  module_name text NOT NULL,
  module_color text NOT NULL DEFAULT 'primary',
  status text NOT NULL DEFAULT 'processing',
  cards_generated integer NOT NULL DEFAULT 0,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view uploads"
ON public.content_uploads FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert uploads"
ON public.content_uploads FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update uploads"
ON public.content_uploads FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign admin role to specific email
CREATE OR REPLACE FUNCTION public.auto_assign_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'joaovictorizidro@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER assign_admin_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin();
