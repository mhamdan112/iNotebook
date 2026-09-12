create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) >= 3),
  description text not null check (char_length(description) >= 5),
  tag text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes(user_id);
alter table public.notes enable row level security;

drop policy if exists "Users can read their own notes" on public.notes;
drop policy if exists "Users can create their own notes" on public.notes;
drop policy if exists "Users can update their own notes" on public.notes;
drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can read their own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can create their own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update their own notes" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notes" on public.notes for delete using (auth.uid() = user_id);

create or replace function public.set_notes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at before update on public.notes
for each row execute procedure public.set_notes_updated_at();