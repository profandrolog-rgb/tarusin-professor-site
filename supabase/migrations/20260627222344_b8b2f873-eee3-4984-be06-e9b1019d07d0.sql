create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  source text,
  category text,
  audio_url text,
  external_url text,
  cover_path text,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.podcasts to anon, authenticated;
grant all on public.podcasts to service_role;
alter table public.podcasts enable row level security;
create policy "podcasts_public_read" on public.podcasts for select using (is_published = true);
create policy "podcasts_admin_all" on public.podcasts for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'editor'));