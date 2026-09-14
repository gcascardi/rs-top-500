create table if not exists public.album_progress (
    album_id integer primary key,
    listened boolean not null default false,
    listen_later boolean not null default false,
    rating numeric(3,1),
    listened_at timestamptz,
    updated_at timestamptz not null default now(),

    constraint album_progress_rating_check
        check (
            rating is null
            or (
                rating between 1 and 5
                and rating = trunc(rating)
            )
        )
);

alter table public.album_progress enable row level security;

grant select, insert, update
on public.album_progress
to anon;

drop policy if exists "Public progress read"
on public.album_progress;

drop policy if exists "Public progress insert"
on public.album_progress;

drop policy if exists "Public progress update"
on public.album_progress;

create policy "Public progress read"
on public.album_progress
for select
to anon
using (true);

create policy "Public progress insert"
on public.album_progress
for insert
to anon
with check (true);

create policy "Public progress update"
on public.album_progress
for update
to anon
using (true)
with check (true);
