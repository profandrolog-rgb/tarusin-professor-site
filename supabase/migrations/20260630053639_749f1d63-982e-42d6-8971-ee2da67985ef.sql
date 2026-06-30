create table if not exists public.content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('blog_post','disease_article','research_article')),
  entity_id uuid not null,
  locale text not null check (char_length(locale) between 2 and 5),
  title text,
  slug text,
  description text,
  card_annotation text,
  content text,
  keywords text[] not null default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published')),
  source_hash text,
  auto_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale)
);

grant select on public.content_translations to anon, authenticated;
grant select, insert, update, delete on public.content_translations to authenticated;
grant all on public.content_translations to service_role;

create index if not exists idx_content_translations_lookup
  on public.content_translations (entity_type, locale, status);
create index if not exists idx_content_translations_slug
  on public.content_translations (locale, slug) where slug is not null;

create or replace function public.tg_content_translations_touch()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_content_translations_touch on public.content_translations;
create trigger trg_content_translations_touch
  before update on public.content_translations
  for each row execute function public.tg_content_translations_touch();

alter table public.content_translations enable row level security;

drop policy if exists "ct_public_read_published" on public.content_translations;
create policy "ct_public_read_published"
  on public.content_translations
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "ct_admin_all" on public.content_translations;
create policy "ct_admin_all"
  on public.content_translations
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role::text in ('admin','editor')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role::text in ('admin','editor')
    )
  );