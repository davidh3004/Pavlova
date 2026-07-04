-- Pavlova Love Tampa — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

create table if not exists app_documents (
  collection text not null,
  doc_id text not null,
  data jsonb not null default '{}'::jsonb,
  primary key (collection, doc_id)
);

create index if not exists app_documents_collection_idx
  on app_documents (collection);

create table if not exists app_counters (
  collection text primary key,
  value bigint not null default 0
);

-- Atomic auto-increment for numeric document ids
create or replace function next_app_counter(coll text)
returns bigint
language plpgsql
as $$
declare
  v bigint;
begin
  insert into app_counters (collection, value)
  values (coll, 1)
  on conflict (collection) do update
    set value = app_counters.value + 1
  returning value into v;
  return v;
end;
$$;

-- Raise counter to at least `min_value` (used by seed)
create or replace function bump_app_counter(coll text, min_value bigint)
returns void
language plpgsql
as $$
begin
  insert into app_counters (collection, value)
  values (coll, min_value)
  on conflict (collection) do update
    set value = greatest(app_counters.value, excluded.value);
end;
$$;
