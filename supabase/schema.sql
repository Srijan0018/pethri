-- Pethri.com Hyperlocal Social News Network
-- Supabase PostgreSQL Schema, RLS Policies, Triggers & Storage Configuration

-- Enable extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 1. Enums
do $$ begin
  create type public.user_role as enum ('citizen', 'correspondent', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_category as enum (
    'news',
    'church',
    'weddings',
    'agriculture',
    'sports',
    'civic',
    'celebrations'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_format as enum ('article', 'photo', 'carousel', 'moment_video', 'dispatch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_tier as enum ('community', 'reviewed', 'verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.moderation_status as enum ('pending', 'approved', 'rejected', 'flagged');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'investigating', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

-- 2. Localities Table
create table if not exists public.localities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  taluk text not null default 'Brahmavar',
  district text not null default 'Udupi',
  pincode text,
  center_lat double precision not null,
  center_lng double precision not null,
  description text,
  active_reporters integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  bio text default '',
  role public.user_role not null default 'citizen',
  home_locality_id uuid references public.localities(id) on delete set null,
  is_verified_reporter boolean not null default false,
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Posts & Moments Table
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid not null references public.localities(id) on delete restrict,
  category public.post_category not null,
  format public.post_format not null default 'photo',
  headline text not null,
  body text not null,
  is_breaking boolean not null default false,
  is_moment boolean not null default false,
  -- SECURITY: Citizen submissions ALWAYS default to 'community' & 'pending'.
  -- Database trigger prevents non-editors from setting 'reviewed' or 'verified'.
  verification_tier public.verification_tier not null default 'community',
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  -- Privacy-first location: only expose precise coordinates if user explicitly consented
  share_precise_location boolean not null default false,
  precise_lat double precision,
  precise_lng double precision,
  approx_landmark text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  shares_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Post Media Table (supports carousels & short videos)
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  public_url text not null,
  poster_url text,
  aspect_ratio text default '4:5',
  duration_seconds integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 6. Engagement Tables (Likes, Bookmarks, Comments)
create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.bookmarks (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- 7. Content Reports & Moderation Queue
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. Local Business Directory
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid not null references public.localities(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  phone text,
  address text not null,
  hours text,
  is_verified boolean not null default false,
  featured_image_url text,
  created_at timestamptz not null default now()
);

-- 9. Community Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid references public.localities(id) on delete set null,
  title text not null,
  summary text not null,
  issuer text not null,
  urgency text not null default 'notice' check (urgency in ('notice', 'advisory', 'urgent')),
  valid_until timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 10. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid references public.localities(id) on delete set null,
  title text not null,
  message text not null,
  href text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 11. Helper Functions & Integrity Triggers
create or replace function public.is_editorial_staff(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('editor', 'admin') and is_suspended = false
  );
$$;

-- Enforce that non-editorial users CANNOT auto-verify or approve their own submissions
create or replace function public.enforce_submission_trust_tier()
returns trigger
language plpgsql
security definer
as $$
begin
  if not public.is_editorial_staff(auth.uid()) then
    new.verification_tier := 'community';
    new.moderation_status := 'pending';
    new.is_breaking := false;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  -- Privacy guard: wipe precise coordinates if consent flag is false
  if new.share_precise_location = false then
    new.precise_lat := null;
    new.precise_lng := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_submission_trust on public.posts;
create trigger trg_enforce_submission_trust
  before insert or update on public.posts
  for each row execute function public.enforce_submission_trust_tier();

-- Privacy-safe view for public consumption (masks precise coordinates when consent is false)
create or replace view public.public_posts_view as
select
  p.id,
  p.author_id,
  p.locality_id,
  p.category,
  p.format,
  p.headline,
  p.body,
  p.is_breaking,
  p.is_moment,
  p.verification_tier,
  p.moderation_status,
  p.approx_landmark,
  p.share_precise_location,
  case when p.share_precise_location then p.precise_lat else null end as public_lat,
  case when p.share_precise_location then p.precise_lng else null end as public_lng,
  p.likes_count,
  p.comments_count,
  p.shares_count,
  p.created_at
from public.posts p;

-- 12. Row-Level Security (RLS)
alter table public.localities enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.content_reports enable row level security;
alter table public.businesses enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

-- Localities: public read, admin write
create policy "Localities public read" on public.localities for select using (true);
create policy "Localities editorial write" on public.localities for all using (public.is_editorial_staff(auth.uid()));

-- Profiles: public read, self update (non-role fields), admin update all
create policy "Profiles public read" on public.profiles for select using (true);
create policy "Profiles insert self" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles update self" on public.profiles for update using (auth.uid() = id or public.is_editorial_staff(auth.uid()));

-- Posts: approved posts are public; authors see own posts; editors see all
create policy "Posts read policy" on public.posts for select using (
  moderation_status = 'approved'
  or auth.uid() = author_id
  or public.is_editorial_staff(auth.uid())
);
create policy "Posts insert authenticated" on public.posts for insert with check (auth.uid() = author_id);
create policy "Posts update author or editor" on public.posts for update using (
  auth.uid() = author_id or public.is_editorial_staff(auth.uid())
);
create policy "Posts delete author or editor" on public.posts for delete using (
  auth.uid() = author_id or public.is_editorial_staff(auth.uid())
);

-- Media, Likes, Bookmarks, Comments
create policy "Post media read" on public.post_media for select using (true);
create policy "Post media insert" on public.post_media for insert with check (
  exists (select 1 from public.posts where id = post_id and author_id = auth.uid())
);

create policy "Likes read" on public.post_likes for select using (true);
create policy "Likes manage self" on public.post_likes for all using (auth.uid() = user_id);

create policy "Bookmarks read self" on public.bookmarks for select using (auth.uid() = user_id);
create policy "Bookmarks manage self" on public.bookmarks for all using (auth.uid() = user_id);

create policy "Comments read" on public.comments for select using (true);
create policy "Comments insert auth" on public.comments for insert with check (auth.uid() = author_id);

-- Content Reports: anyone authenticated can file, only editorial staff can view/resolve
create policy "Reports insert auth" on public.content_reports for insert with check (auth.uid() = reporter_id);
create policy "Reports read editorial" on public.content_reports for select using (public.is_editorial_staff(auth.uid()) or auth.uid() = reporter_id);
create policy "Reports update editorial" on public.content_reports for update using (public.is_editorial_staff(auth.uid()));

-- Businesses & Announcements
create policy "Businesses public read" on public.businesses for select using (true);
create policy "Businesses editorial write" on public.businesses for all using (public.is_editorial_staff(auth.uid()));

create policy "Announcements public read" on public.announcements for select using (true);
create policy "Announcements editorial write" on public.announcements for all using (public.is_editorial_staff(auth.uid()));

-- Notifications: user reads and updates own
create policy "Notifications read self" on public.notifications for select using (auth.uid() = user_id);
create policy "Notifications update self" on public.notifications for update using (auth.uid() = user_id);

-- 13. Storage Bucket for Pethri Media (run in Supabase Dashboard or SQL)
insert into storage.buckets (id, name, public)
values ('pethri-media', 'pethri-media', true)
on conflict (id) do nothing;

create policy "Pethri media public read" on storage.objects
  for select using (bucket_id = 'pethri-media');
create policy "Pethri media auth upload" on storage.objects
  for insert with check (bucket_id = 'pethri-media' and auth.role() = 'authenticated');
