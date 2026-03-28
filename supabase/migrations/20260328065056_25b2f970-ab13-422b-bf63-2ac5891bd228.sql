
CREATE TABLE public.review_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL,
  rating text,
  review_count text,
  description text,
  url text NOT NULL,
  logo_key text NOT NULL,
  last_scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review platforms"
  ON public.review_platforms FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage review platforms"
  ON public.review_platforms FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

INSERT INTO public.review_platforms (platform_name, rating, review_count, description, url, logo_key) VALUES
  ('ProDoctorov', '5.0', '26', 'Крупнейший сервис поиска врачей в России', 'https://prodoctorov.ru/moskva/vrach/32554-tarusin/', 'prodoctorov'),
  ('Яндекс.Здоровье', '5.0', '40', 'Медицинский сервис Яндекса', 'https://yandex.ru/medicine/doctor/tarusin_dmitriy_FoTXtQPJy5wOJ', 'yandex-health'),
  ('DocDoc', '4.5', '13', 'Сервис записи к врачам онлайн', 'https://docdoc.ru/doctor/Tarusin_Dmitriy', 'docdoc');
