-- Run once in your own Supabase Free project's SQL Editor.
-- Entries are private to the authenticated account; the public key grants no access alone.
create table if not exists public.tracker_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  payload jsonb,
  deleted boolean not null default false,
  modified bigint not null check (modified between 0 and 9007199254740991),
  change_id text not null check (length(change_id) between 1 and 200),
  primary key (user_id, id),
  constraint valid_payload check (
    case when deleted then payload is null else
      coalesce(jsonb_typeof(payload) = 'object'
      and jsonb_typeof(payload->'id') = 'string' and payload->>'id' = id
      and jsonb_typeof(payload->'name') = 'string' and length(trim(payload->>'name')) between 1 and 160
      and payload->>'type' in ('job','internship','scholarship','other')
      and payload->>'status' in ('waiting','rejected','accepted')
      and payload->>'applied' ~ '^\d{4}-\d{2}-\d{2}$'
      and (payload->>'status' <> 'rejected' or payload->>'rejected' ~ '^\d{4}-\d{2}-\d{2}$'), false)
    end
  )
);
alter table public.tracker_items enable row level security;
drop policy if exists "Own entries only" on public.tracker_items;
create policy "Own entries only" on public.tracker_items
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.tracker_items from public, anon, authenticated;
grant select, insert, update on public.tracker_items to authenticated;

create or replace function public.sync_tracker(changes jsonb)
returns setof public.tracker_items
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes) > 500 then
    raise exception 'Invalid sync batch';
  end if;
  insert into public.tracker_items as existing (user_id,id,payload,deleted,modified,change_id)
    select auth.uid(), item->>'id', nullif(item->'payload','null'::jsonb),
      (item->>'deleted')::boolean, (item->>'modified')::bigint, item->>'change_id'
    from jsonb_array_elements(changes) as item
    on conflict (user_id,id) do update set
      payload=excluded.payload, deleted=excluded.deleted,
      modified=excluded.modified, change_id=excluded.change_id
    where (excluded.modified,excluded.change_id) > (existing.modified,existing.change_id);
  return query select * from public.tracker_items where user_id=auth.uid() order by modified,id;
end;
$$;
revoke all on function public.sync_tracker(jsonb) from public, anon;
grant execute on function public.sync_tracker(jsonb) to authenticated;
