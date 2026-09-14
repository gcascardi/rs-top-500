-- Execute antes de publicar a versão com a lista Ouvir depois.
alter table public.album_progress
    add column if not exists listen_later boolean not null default false;

notify pgrst, 'reload schema';
