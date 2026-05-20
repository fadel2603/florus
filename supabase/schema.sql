-- ─── Profiles ────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  plan    text not null default 'free' check (plan in ('free', 'premium')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile row when a new user signs up (incl. anonymous)
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Plants ───────────────────────────────────────────────────────────────────

create table if not exists plants (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  name             text not null,
  species          text not null,
  image            text not null,
  care_status      text,
  water_frequency  text not null default 'Tous les 7 jours',
  last_watered     text not null default 'Jamais',
  health           text not null default 'good' check (health in ('good', 'warning', 'critical')),
  light_needs      text check (light_needs in ('low', 'medium', 'high')),
  location         text check (location in ('indoor', 'outdoor')),
  health_note      text,
  issues           text[] default '{}',
  created_at       timestamptz default now()
);

alter table plants enable row level security;

create policy "own plants" on plants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Tasks ────────────────────────────────────────────────────────────────────

create table if not exists tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  plant_id         uuid references plants(id) on delete cascade not null,
  plant_name       text not null,
  type             text not null check (type in ('water','observe','fertilize','repot','treat','rotate','clean_leaves','mist','trim')),
  day_of_week      int not null check (day_of_week between 0 and 6),
  last_done_date   text,           -- 'YYYY-MM-DD', null = never done today
  time             text,
  recurring        boolean not null default false,
  recurring_days   int,
  created_at       timestamptz default now()
);

alter table tasks enable row level security;

create policy "own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── History events ───────────────────────────────────────────────────────────

create table if not exists history_events (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  plant_id  uuid references plants(id) on delete cascade not null,
  type      text not null check (type in ('added', 'task_done', 'analysis')),
  label     text not null,
  date      timestamptz not null default now(),
  icon      text not null,
  color     text not null
);

alter table history_events enable row level security;

create policy "own history_events" on history_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
