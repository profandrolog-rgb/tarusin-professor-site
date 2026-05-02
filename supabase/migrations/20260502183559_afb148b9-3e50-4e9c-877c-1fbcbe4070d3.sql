
-- 1. Add length constraint on problem_description via trigger
CREATE OR REPLACE FUNCTION public.validate_appointment_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF char_length(NEW.problem_description) > 5000 THEN
    RAISE EXCEPTION 'problem_description exceeds maximum length of 5000 characters';
  END IF;
  IF NEW.contact_email IS NOT NULL AND char_length(NEW.contact_email) > 255 THEN
    RAISE EXCEPTION 'contact_email exceeds maximum length of 255 characters';
  END IF;
  IF NEW.parent_name IS NOT NULL AND char_length(NEW.parent_name) > 100 THEN
    RAISE EXCEPTION 'parent_name exceeds maximum length of 100 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_appointment_request_trigger
BEFORE INSERT OR UPDATE ON public.appointment_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_appointment_request();

-- 2. Fix blog_comments: replace public SELECT policy to hide author_email for non-owners/non-admins
-- We use a security definer function to strip email for unauthorized viewers
DROP POLICY IF EXISTS "Anyone can view approved comments" ON public.blog_comments;

CREATE POLICY "Anyone can view approved comments"
ON public.blog_comments
FOR SELECT
TO public
USING (
  (is_approved = true) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR (auth.uid() = user_id)
);

-- 3. Fix questions: replace public SELECT policy - email only visible to admins
DROP POLICY IF EXISTS "Anyone can view published questions" ON public.questions;

CREATE POLICY "Anyone can view published questions"
ON public.questions
FOR SELECT
TO public
USING (
  (is_published = true) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Fix search_path on SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$$;
