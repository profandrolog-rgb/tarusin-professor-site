
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_email text NOT NULL,
  question_text text NOT NULL,
  answer_text text,
  is_published boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  answered_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a question
CREATE POLICY "Anyone can submit a question"
ON public.questions FOR INSERT
TO public
WITH CHECK (true);

-- Anyone can view published questions
CREATE POLICY "Anyone can view published questions"
ON public.questions FOR SELECT
TO public
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can update questions
CREATE POLICY "Admins can update questions"
ON public.questions FOR UPDATE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete questions
CREATE POLICY "Admins can delete questions"
ON public.questions FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
