-- Esquema de la web en Supabase. Pégalo entero en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez sin problemas.
--
-- La web accede solo desde el servidor con la clave service_role. RLS queda
-- activado sin políticas públicas, así que nada es legible desde el navegador.

-- Noticias, cuentas del panel, ajustes y borradores de IA (un documento JSON por fila).
create table if not exists public.documents (
  collection text not null,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists documents_collection_idx on public.documents (collection);

alter table public.documents enable row level security;

-- Fotos: lectura pública (se muestran en la web), escritura solo desde el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
