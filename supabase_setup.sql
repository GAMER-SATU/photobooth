-- ==========================================
-- DUET PHOTOBOOTH — SUPABASE SETUP SCRIPT
-- ==========================================

-- 1. Create storage bucket for photo strip PNGs
insert into storage.buckets (id, name, public)
values ('photostrips', 'photostrips', true)
on conflict (id) do nothing;

-- Set public read access policy on photostrips bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'photostrips' );

create policy "Public Insert"
  on storage.objects for insert
  with check ( bucket_id = 'photostrips' );

-- 2. Create Database Table for saved photo strips
create table if not exists public.photostrips (
  id text primary key,
  room_code text not null,
  image_url text not null,
  captions text,
  filter_used text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS) & set public policy
alter table public.photostrips enable row level security;

create policy "Allow Public Select on photostrips"
  on public.photostrips for select
  using (true);

create policy "Allow Public Insert on photostrips"
  on public.photostrips for insert
  with check (true);

-- 3. Create Database Table for active photo booth rooms
create table if not exists public.rooms (
  id text primary key default gen_random_uuid()::text,
  room_code text unique not null,
  host_participant_id text not null,
  status text not null default 'active',
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '24 hours')
);

create index if not exists idx_rooms_room_code on public.rooms(room_code);

-- Enable Row Level Security (RLS) & set public policies for rooms
alter table public.rooms enable row level security;

create policy "Allow Public Select on rooms"
  on public.rooms for select
  using (true);

create policy "Allow Public Insert on rooms"
  on public.rooms for insert
  with check (true);

create policy "Allow Public Update on rooms"
  on public.rooms for update
  using (true);
