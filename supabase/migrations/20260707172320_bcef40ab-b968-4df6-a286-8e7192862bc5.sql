CREATE TABLE public.parents_material_leads (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.parents_materials(id) on delete cascade,
  name text,
  email text,
  phone text,
  consent boolean not null default true,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

CREATE INDEX parents_material_leads_material_idx ON public.parents_material_leads(material_id, created_at desc);

GRANT INSERT ON public.parents_material_leads TO anon, authenticated;
GRANT SELECT ON public.parents_material_leads TO authenticated;
GRANT ALL ON public.parents_material_leads TO service_role;

ALTER TABLE public.parents_material_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON public.parents_material_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (email IS NOT NULL AND length(trim(email)) > 3) OR
    (phone IS NOT NULL AND length(trim(phone)) > 3)
  );

CREATE POLICY "Admins can read leads"
  ON public.parents_material_leads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));