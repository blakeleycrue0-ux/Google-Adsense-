-- Esquema de Supabase para Voltio.
-- Ejecutar en el editor SQL del proyecto (o con `supabase db push`).
-- El servidor accede con la clave service_role; RLS queda activado sin
-- políticas públicas para que nada sea legible desde el navegador.

create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- Índices para consultas frecuentes sobre artículos.
create index if not exists documents_collection_idx on public.documents (collection);
create index if not exists documents_post_slug_idx
  on public.documents ((data->>'slug')) where collection = 'posts';
create index if not exists documents_post_published_idx
  on public.documents ((data->>'publishedAt')) where collection = 'posts';

create table if not exists public.counters (
  key text primary key,
  value bigint not null default 0
);

create or replace function public.increment_counter(counter_key text, amount int default 1)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.counters (key, value) values (counter_key, amount)
  on conflict (key) do update set value = public.counters.value + excluded.value;
$$;

revoke all on function public.increment_counter(text, int) from public, anon, authenticated;

alter table public.documents enable row level security;
alter table public.counters enable row level security;

-- Bucket público de imágenes (lectura pública, escritura solo con service_role).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
