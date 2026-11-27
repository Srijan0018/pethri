-- Pethri.com Migration 001: Idempotent Base Relational Schema
-- Safe to run on either a fresh PostgreSQL 18 instance or an existing Supabase database.
-- Uses IF NOT EXISTS / exception guards so existing data and tables are preserved.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Provide minimal auth compatibility stub only on standalone PostgreSQL where Supabase auth schema is absent
do $$
begin
  if not exists (select 1 from information_schema.schemata where schema_name = 'auth') then
    execute 'create schema auth';
    execute $fn$
      create or replace function auth.uid() returns uuid
      language sql stable as 'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
    $fn$;
  end if;
end $$;

do $$ begin
  create type public.user_role as enum ('citizen', 'correspondent', 'journalist', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_category as enum (
    'news', 'church', 'weddings', 'agriculture', 'sports', 'civic', 'celebrations'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_format as enum ('article', 'photo', 'carousel', 'moment_video', 'dispatch');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_source_kind as enum ('newsroom', 'citizen', 'sponsored');
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

create table if not exists public.localities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_kn text,
  taluk text not null default 'Brahmavar',
  district text not null default 'Udupi',
  pincode text,
  center_lat double precision not null,
  center_lng double precision not null,
  description text,
  active_reporters integer not null default 0 check (active_reporters >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create profiles compatible with Supabase auth.users when present, or standalone PostgreSQL otherwise
do $$
begin
  if to_regclass('public.profiles') is null then
    if to_regclass('auth.users') is not null then
      create table public.profiles (
        id uuid primary key references auth.users(id) on delete cascade,
        username text unique not null,
        full_name text not null,
        avatar_url text,
        bio text default '',
        role public.user_role not null default 'citizen',
        home_locality_id uuid references public.localities(id) on delete set null,
        is_verified_reporter boolean not null default false,
        is_suspended boolean not null default false,
        followers_count integer not null default 0 check (followers_count >= 0),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    else
      create table public.profiles (
        id uuid primary key default gen_random_uuid(),
        username text unique not null,
        full_name text not null,
        avatar_url text,
        bio text default '',
        role public.user_role not null default 'citizen',
        home_locality_id uuid references public.localities(id) on delete set null,
        is_verified_reporter boolean not null default false,
        is_suspended boolean not null default false,
        followers_count integer not null default 0 check (followers_count >= 0),
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    end if;
  end if;
end $$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid not null references public.localities(id) on delete restrict,
  category public.post_category not null,
  format public.post_format not null default 'photo',
  source_kind public.post_source_kind not null default 'citizen',
  sponsor_advertiser text,
  sponsor_disclosure text,
  headline text not null,
  headline_kn text,
  body text not null,
  body_kn text,
  is_breaking boolean not null default false,
  is_moment boolean not null default false,
  playlist_slug text,
  verification_tier public.verification_tier not null default 'community',
  moderation_status public.moderation_status not null default 'pending',
  moderation_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  share_precise_location boolean not null default false,
  precise_lat double precision,
  precise_lng double precision,
  approx_landmark text,
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  shares_count integer not null default 0 check (shares_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_corrections (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  summary text not null,
  corrected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.live_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  channel_name text not null default 'Pethri Live Desk',
  locality_id uuid references public.localities(id) on delete set null,
  host_id uuid references public.profiles(id) on delete set null,
  is_live boolean not null default false,
  viewer_count integer not null default 0 check (viewer_count >= 0),
  reactions_count integer not null default 0 check (reactions_count >= 0),
  poster_url text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table if not exists public.local_events (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid not null references public.localities(id) on delete cascade,
  title text not null,
  category public.post_category not null default 'celebrations',
  starts_at timestamptz not null,
  venue text not null,
  organizer text not null,
  rsvp_count integer not null default 0 check (rsvp_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, target_profile_id),
  check (follower_id <> target_profile_id)
);

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
