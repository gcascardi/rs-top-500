-- Execute este arquivo uma vez no SQL Editor do Supabase antes de publicar
-- a interface de 1 a 5 estrelas. A operação preserva status, datas e IDs.
-- O bloco verifica a nova constraint para não reconverter valores em execuções futuras.

do $$
declare
    stars_constraint_exists boolean;
begin
    select exists (
        select 1
        from pg_constraint
        where conrelid = 'public.album_progress'::regclass
          and conname = 'album_progress_rating_check'
          and pg_get_constraintdef(oid) ilike '%trunc%'
    ) into stars_constraint_exists;

    if not stars_constraint_exists then
        alter table public.album_progress
            drop constraint if exists album_progress_rating_check;

        update public.album_progress
        set
            rating = case
                when rating is null then null
                when rating <= 0 then 1
                else greatest(1, least(5, round(rating / 2.0)))
            end,
            updated_at = now()
        where rating is not null;

        alter table public.album_progress
            add constraint album_progress_rating_check
            check (
                rating is null
                or (
                    rating between 1 and 5
                    and rating = trunc(rating)
                )
            );
    end if;
end
$$;
