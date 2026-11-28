-- Pethri.com Migration 004: Phase 1 Backend & Database Foundation
-- Adds normalized tables for Topic Follows, User Locality Preferences,
-- Editorial Reviews, Civic Report History, Event Media & News Tip Attachments.
-- Enables Row Level Security (RLS) on all added tables with strict access policies.

-- 1. User Locality & Language Preferences
create table if not exists public.user_locality_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  primary_locality_id uuid references public.localities(id) on delete set null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'kn')),
  notify_breaking boolean not null default true,
  notify_civic_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 2. Topic Follows (Complementing Locality Follows and Profile Follows)
create table if not exists public.topic_follows (
  category_slug text not null references public.categories(slug) on update cascade on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (category_slug, user_id)
);

-- 3. Dedicated Editorial Reviews Log
create table if not exists public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete set null,
  action text not null default 'reviewed',
  previous_status public.moderation_status,
  new_status public.moderation_status not null,
  previous_tier public.verification_tier,
  new_tier public.verification_tier,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Civic Report Status Transition History
create table if not exists public.civic_report_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.civic_reports(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  previous_status text,
  new_status text not null,
  resolution_notes text,
  created_at timestamptz not null default now()
);

-- Trigger to record status transitions automatically on civic_reports update
create or replace function public.log_civic_report_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.civic_report_history (
      report_id,
      changed_by,
      previous_status,
      new_status,
      resolution_notes
    ) values (
      new.id,
      coalesce(auth.uid(), new.assigned_to),
      old.status,
      new.status,
      new.resolution_notes
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_civic_report_status_change on public.civic_reports;
create trigger trg_civic_report_status_change
  after update on public.civic_reports
  for each row execute function public.log_civic_report_status_change();

-- 5. Event Media Assets
create table if not exists public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.local_events(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  storage_path text not null,
  public_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 6. News Tip Attachments (Confidential Evidence Storage)
create table if not exists public.news_tip_attachments (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references public.news_tips(id) on delete cascade,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  file_name text,
  file_size_bytes bigint,
  mime_type text,
  storage_path text not null,
  is_confidential boolean not null default true,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 7. Query Performance Indexes
create index if not exists idx_topic_follows_user on public.topic_follows(user_id);
create index if not exists idx_editorial_reviews_post on public.editorial_reviews(post_id, created_at desc);
create index if not exists idx_civic_report_history_report on public.civic_report_history(report_id, created_at desc);
create index if not exists idx_event_media_event on public.event_media(event_id, sort_order asc);
create index if not exists idx_news_tip_attachments_tip on public.news_tip_attachments(tip_id);

-- 8. Enable Row Level Security (RLS) on All New Tables
alter table public.user_locality_preferences enable row level security;
alter table public.topic_follows enable row level security;
alter table public.editorial_reviews enable row level security;
alter table public.civic_report_history enable row level security;
alter table public.event_media enable row level security;
alter table public.news_tip_attachments enable row level security;

-- 9. Row Level Security Policies

-- user_locality_preferences: Own record access only
drop policy if exists "Preferences read self" on public.user_locality_preferences;
create policy "Preferences read self" on public.user_locality_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "Preferences manage self" on public.user_locality_preferences;
create policy "Preferences manage self" on public.user_locality_preferences
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- topic_follows: Public follow counts viewable, own record manageable
drop policy if exists "Topic follows public read" on public.topic_follows;
create policy "Topic follows public read" on public.topic_follows
  for select using (true);

drop policy if exists "Topic follows manage self" on public.topic_follows;
create policy "Topic follows manage self" on public.topic_follows
  for all using (auth.uid() = user_id and not public.is_user_suspended(auth.uid()))
  with check (auth.uid() = user_id and not public.is_user_suspended(auth.uid()));

-- editorial_reviews: Accredited editorial staff only
drop policy if exists "Editorial reviews staff only" on public.editorial_reviews;
create policy "Editorial reviews staff only" on public.editorial_reviews
  for select using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Editorial reviews staff insert" on public.editorial_reviews;
create policy "Editorial reviews staff insert" on public.editorial_reviews
  for insert with check (public.is_editorial_staff(auth.uid()));

-- civic_report_history: Submitter or staff
drop policy if exists "Civic report history read permitted" on public.civic_report_history;
create policy "Civic report history read permitted" on public.civic_report_history
  for select using (
    public.is_editorial_staff(auth.uid()) or
    exists (
      select 1 from public.civic_reports cr
      where cr.id = report_id and cr.reporter_id = auth.uid()
    )
  );

-- event_media: Public read, staff manage
drop policy if exists "Event media public read" on public.event_media;
create policy "Event media public read" on public.event_media
  for select using (true);

drop policy if exists "Event media staff manage" on public.event_media;
create policy "Event media staff manage" on public.event_media
  for all using (public.is_editorial_staff(auth.uid()))
  with check (public.is_editorial_staff(auth.uid()));

-- news_tip_attachments: Submitter or staff ONLY (strictly private)
drop policy if exists "News tip attachments private access" on public.news_tip_attachments;
create policy "News tip attachments private access" on public.news_tip_attachments
  for select using (
    auth.uid() = uploaded_by or
    public.is_editorial_staff(auth.uid())
  );

drop policy if exists "News tip attachments insert submitter" on public.news_tip_attachments;
create policy "News tip attachments insert submitter" on public.news_tip_attachments
  for insert with check (
    auth.uid() = uploaded_by and
    not public.is_user_suspended(auth.uid())
  );
