-- Pethri.com Migration 002: Normalized Governance, Permissions, Private Tips,
-- Revisions, Audit Logs, Storage Security & Strict Backend RLS Policies
-- Additive & idempotent: never drops existing tables or deletes data.

-- 1. Normalized Roles & Categories Lookup Tables
create table if not exists public.roles (
  slug text primary key,
  display_name text not null,
  is_staff boolean not null default false,
  hierarchy_level integer not null check (hierarchy_level >= 0),
  description text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (slug, display_name, is_staff, hierarchy_level, description)
values
  ('citizen', 'Public Reader / Contributor', false, 10, 'Can browse public content, react, comment, bookmark, RSVP, and submit private news tips.'),
  ('correspondent', 'Accredited Reporter', true, 30, 'Field reporter working inside Private Pethri Studio; direct publishing/media/live governed by manager permissions.'),
  ('journalist', 'Newsroom Journalist', true, 50, 'Staff journalist able to draft and publish according to editorial permissions.'),
  ('editor', 'Editorial Lead', true, 80, 'Authorised editor overseeing verification, tip triage, article revisions, and moderation.'),
  ('admin', 'Website Manager', true, 100, 'Full newsroom & permission governance across Pethri Studio.')
on conflict (slug) do nothing;

create table if not exists public.categories (
  slug text primary key,
  label_en text not null,
  label_kn text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.categories (slug, label_en, label_kn, sort_order)
values
  ('news', 'Local News', 'ಸ್ಥಳೀಯ ಸುದ್ದಿ', 1),
  ('church', 'Church & Faith', 'ಚರ್ಚ್ ಮತ್ತು ಧಾರ್ಮಿಕ', 2),
  ('weddings', 'Weddings', 'ಮದುವೆ ಸಂಭ್ರಮ', 3),
  ('agriculture', 'Agriculture', 'ಕೃಷಿ ಮತ್ತು ಬೆಳೆ', 4),
  ('sports', 'Sports & Kabaddi', 'ಕ್ರೀಡೆ ಮತ್ತು ಕಬಡ್ಡಿ', 5),
  ('civic', 'Public Issues', 'ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆ', 6),
  ('celebrations', 'Celebrations', 'ಉತ್ಸವ ಮತ್ತು ಹಬ್ಬ', 7)
on conflict (slug) do nothing;

-- Non-destructive column additions on existing base tables
alter table public.localities
  add column if not exists name_kn text,
  add column if not exists is_primary boolean not null default false;

alter table public.profiles
  add column if not exists email text,
  add column if not exists role_slug text references public.roles(slug) on update cascade;

update public.profiles
set role_slug = role::text
where role_slug is null;

alter table public.posts
  add column if not exists category_slug text references public.categories(slug) on update cascade,
  add column if not exists headline_kn text,
  add column if not exists body_kn text,
  add column if not exists revision_count integer not null default 1;

update public.posts
set category_slug = category::text
where category_slug is null;

alter table public.live_broadcasts
  add column if not exists category_slug text references public.categories(slug) on update cascade,
  add column if not exists stream_source_kind text not null default 'official_newsroom'
    check (stream_source_kind in ('official_newsroom')),
  add column if not exists reactions_count integer not null default 0,
  add column if not exists ended_at timestamptz;

alter table public.comments
  add column if not exists is_hidden boolean not null default false,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null,
  add column if not exists moderated_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- 2. Manager-Controlled Reporter Permissions & Immutable Permission History
create table if not exists public.reporter_permissions (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  can_publish_articles boolean not null default false,
  can_upload_official_media boolean not null default false,
  can_start_broadcasts boolean not null default false,
  can_publish_breaking boolean not null default false,
  can_moderate_comments boolean not null default false,
  granted_by uuid references public.profiles(id) on delete set null,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.permission_history (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  previous_role text,
  new_role text,
  previous_permissions jsonb not null default '{}'::jsonb,
  new_permissions jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- 3. Normalized Media Assets (Private Tip Evidence vs Official Public Editorial Media)
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid references public.localities(id) on delete set null,
  bucket_name text not null default 'private-tip-evidence'
    check (bucket_name in ('private-tip-evidence', 'public-editorial-media')),
  storage_path text unique not null,
  public_url text,
  poster_url text,
  mime_type text,
  media_type text not null check (media_type in ('image', 'video')),
  visibility text not null default 'private'
    check (visibility in ('private', 'editorial', 'public')),
  is_official boolean not null default false,
  aspect_ratio text default '4:5',
  duration_seconds integer,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.post_media
  add column if not exists media_asset_id uuid references public.media_assets(id) on delete set null;

-- 4. Private News Tips & Confidential Evidence
create table if not exists public.news_tips (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles(id) on delete cascade,
  locality_id uuid not null references public.localities(id) on delete restrict,
  category_slug text not null references public.categories(slug) on update cascade,
  tip_type text not null default 'news_tip' check (tip_type in ('news_tip', 'civic_issue')),
  headline text not null,
  details text not null,
  approx_landmark text,
  share_precise_location boolean not null default false,
  precise_lat double precision,
  precise_lng double precision,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'converted_to_article', 'archived', 'rejected')),
  assigned_editor_id uuid references public.profiles(id) on delete set null,
  moderation_notes text,
  published_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.tip_evidence (
  id uuid primary key default gen_random_uuid(),
  tip_id uuid not null references public.news_tips(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  is_confidential boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tip_id, media_asset_id)
);

-- 5. Article Revision History
create table if not exists public.article_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  revision_number integer not null check (revision_number >= 1),
  headline text not null,
  body text not null,
  category text not null,
  verification_tier public.verification_tier not null,
  moderation_status public.moderation_status not null,
  is_breaking boolean not null default false,
  edited_by uuid references public.profiles(id) on delete set null,
  change_summary text not null default 'Article snapshot',
  created_at timestamptz not null default now(),
  unique (post_id, revision_number)
);

-- 6. Civic Reports, Reactions, Locality Follows, Events RSVP, Live Chat, Playlists
create table if not exists public.civic_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  locality_id uuid not null references public.localities(id) on delete restrict,
  category_slug text not null default 'civic' references public.categories(slug) on update cascade,
  title text not null,
  description text not null,
  approx_landmark text,
  share_precise_location boolean not null default false,
  precise_lat double precision,
  precise_lng double precision,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'triaged', 'in_progress', 'resolved', 'dismissed')),
  is_public_verified boolean not null default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  linked_tip_id uuid references public.news_tips(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null default 'like' check (reaction_type in ('like', 'insightful', 'support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.locality_follows (
  locality_id uuid not null references public.localities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (locality_id, user_id)
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.local_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (status in ('going', 'interested', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid not null references public.live_broadcasts(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message_text text not null check (char_length(message_text) between 1 and 500),
  is_hidden boolean not null default false,
  moderated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  cover_url text,
  subscribers_count integer not null default 0 check (subscribers_count >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.playlist_subscriptions (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);

-- 7. Editorial Moderation & Immutable Audit Logs
create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'news_tip', 'comment', 'content_report', 'civic_report', 'live_chat')),
  target_id uuid not null,
  action text not null,
  previous_status text,
  new_status text,
  notes text,
  moderator_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null,
  entity_table text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 8. Performance & Query Indexes
create index if not exists idx_posts_locality_status_created on public.posts(locality_id, moderation_status, created_at desc);
create index if not exists idx_posts_category_status on public.posts(category, moderation_status);
create index if not exists idx_posts_source_kind on public.posts(source_kind, created_at desc);
create index if not exists idx_news_tips_status_locality on public.news_tips(status, locality_id, created_at desc);
create index if not exists idx_news_tips_submitter on public.news_tips(submitter_id, created_at desc);
create index if not exists idx_article_revisions_post on public.article_revisions(post_id, revision_number desc);
create index if not exists idx_comments_post_visible on public.comments(post_id, is_hidden, created_at asc);
create index if not exists idx_live_chat_broadcast on public.live_chat_messages(broadcast_id, created_at asc);
create index if not exists idx_civic_reports_locality_status on public.civic_reports(locality_id, status, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_table, entity_id, created_at desc);
create index if not exists idx_permission_history_target on public.permission_history(target_profile_id, created_at desc);

-- 9. Authorization Helper Functions & Enforcement Triggers
create or replace function public.is_editorial_staff(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and role in ('journalist', 'editor', 'admin')
      and is_suspended = false
  );
$$;

create or replace function public.is_website_manager(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and role in ('editor', 'admin')
      and is_suspended = false
  );
$$;

create or replace function public.has_reporter_permission(uid uuid, perm_key text)
returns boolean
language sql
stable
security definer
as $$
  select case
    when public.is_website_manager(uid) then true
    when not exists (
      select 1 from public.profiles
      where id = uid
        and role in ('correspondent', 'journalist')
        and is_suspended = false
    ) then false
    when perm_key = 'publish' then coalesce(
      (select can_publish_articles from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'media' then coalesce(
      (select can_upload_official_media from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'live' then coalesce(
      (select can_start_broadcasts from public.reporter_permissions where profile_id = uid), false
    )
    else false
  end;
$$;

-- Trigger 1: Enforce strict publishing guard on posts
create or replace function public.enforce_submission_trust_tier()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.has_reporter_permission(auth.uid(), 'publish') then
    new.source_kind := 'citizen';
    new.verification_tier := 'community';
    new.moderation_status := 'pending';
    new.is_breaking := false;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  if new.share_precise_location = false then
    new.precise_lat := null;
    new.precise_lng := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_enforce_submission_trust on public.posts;
create trigger trg_enforce_submission_trust
  before insert or update on public.posts
  for each row execute function public.enforce_submission_trust_tier();

-- Trigger 2: Preserve immutable article revision snapshots
create or replace function public.snapshot_article_revision()
returns trigger
language plpgsql
security definer
as $$
declare
  next_rev integer;
begin
  if (tg_op = 'INSERT') or
     (new.headline is distinct from old.headline or
      new.body is distinct from old.body or
      new.moderation_status is distinct from old.moderation_status or
      new.verification_tier is distinct from old.verification_tier) then
    select coalesce(max(revision_number), 0) + 1
      into next_rev
      from public.article_revisions
      where post_id = new.id;

    insert into public.article_revisions (
      post_id, revision_number, headline, body, category,
      verification_tier, moderation_status, is_breaking, edited_by, change_summary
    ) values (
      new.id,
      next_rev,
      new.headline,
      new.body,
      new.category::text,
      new.verification_tier,
      new.moderation_status,
      new.is_breaking,
      coalesce(new.reviewed_by, new.author_id),
      case when tg_op = 'INSERT' then 'Initial revision' else 'Editorial/content update' end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_snapshot_article_revision on public.posts;
create trigger trg_snapshot_article_revision
  after insert or update on public.posts
  for each row execute function public.snapshot_article_revision();

-- Trigger 3: Log every reporter permission change into permission_history
create or replace function public.log_reporter_permission_change()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.permission_history (
    target_profile_id, changed_by, previous_permissions, new_permissions, reason
  ) values (
    new.profile_id,
    coalesce(new.granted_by, auth.uid()),
    case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end,
    to_jsonb(new),
    coalesce(new.notes, 'Reporter permission updated by Website Manager')
  );
  return new;
end;
$$;

drop trigger if exists trg_log_reporter_permission on public.reporter_permissions;
create trigger trg_log_reporter_permission
  after insert or update on public.reporter_permissions
  for each row execute function public.log_reporter_permission_change();

-- Trigger 4: Enforce media asset privacy & official media permission
create or replace function public.enforce_media_asset_governance()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.has_reporter_permission(auth.uid(), 'media') then
    new.bucket_name := 'private-tip-evidence';
    new.visibility := 'private';
    new.is_official := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_media_governance on public.media_assets;
create trigger trg_enforce_media_governance
  before insert or update on public.media_assets
  for each row execute function public.enforce_media_asset_governance();

-- 10. Row-Level Security (RLS) on Base & Normalized Tables
alter table public.localities enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_corrections enable row level security;
alter table public.live_broadcasts enable row level security;
alter table public.local_events enable row level security;
alter table public.user_follows enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.content_reports enable row level security;
alter table public.businesses enable row level security;
alter table public.announcements enable row level security;
alter table public.notifications enable row level security;

alter table public.roles enable row level security;
alter table public.categories enable row level security;
alter table public.reporter_permissions enable row level security;
alter table public.permission_history enable row level security;
alter table public.media_assets enable row level security;
alter table public.news_tips enable row level security;
alter table public.tip_evidence enable row level security;
alter table public.article_revisions enable row level security;
alter table public.civic_reports enable row level security;
alter table public.reactions enable row level security;
alter table public.locality_follows enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.live_chat_messages enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_subscriptions enable row level security;
alter table public.moderation_logs enable row level security;
alter table public.audit_logs enable row level security;

-- Base table policies (idempotent)
drop policy if exists "Localities public read" on public.localities;
create policy "Localities public read" on public.localities for select using (true);
drop policy if exists "Localities editorial write" on public.localities;
create policy "Localities editorial write" on public.localities for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Profiles public read" on public.profiles;
create policy "Profiles public read" on public.profiles for select using (true);
drop policy if exists "Profiles insert self" on public.profiles;
create policy "Profiles insert self" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Profiles update self" on public.profiles;
create policy "Profiles update self" on public.profiles for update using (auth.uid() = id or public.is_website_manager(auth.uid()));

drop policy if exists "Posts read policy" on public.posts;
create policy "Posts read policy" on public.posts for select using (
  moderation_status = 'approved'
  or auth.uid() = author_id
  or public.is_editorial_staff(auth.uid())
);
drop policy if exists "Posts insert authenticated" on public.posts;
create policy "Posts insert authenticated" on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists "Posts update author or editor" on public.posts;
create policy "Posts update author or editor" on public.posts for update using (
  auth.uid() = author_id or public.is_editorial_staff(auth.uid())
);
drop policy if exists "Posts delete author or editor" on public.posts;
create policy "Posts delete author or editor" on public.posts for delete using (
  auth.uid() = author_id or public.is_editorial_staff(auth.uid())
);

drop policy if exists "Corrections public read" on public.post_corrections;
create policy "Corrections public read" on public.post_corrections for select using (true);
drop policy if exists "Corrections editorial write" on public.post_corrections;
create policy "Corrections editorial write" on public.post_corrections for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Broadcasts public read" on public.live_broadcasts;
create policy "Broadcasts public read" on public.live_broadcasts for select using (true);
drop policy if exists "Events public read" on public.local_events;
create policy "Events public read" on public.local_events for select using (true);
drop policy if exists "Events editorial write" on public.local_events;
create policy "Events editorial write" on public.local_events for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Follows read" on public.user_follows;
create policy "Follows read" on public.user_follows for select using (true);
drop policy if exists "Follows manage self" on public.user_follows;
create policy "Follows manage self" on public.user_follows for all using (auth.uid() = follower_id);

drop policy if exists "Post media read" on public.post_media;
create policy "Post media read" on public.post_media for select using (
  exists (
    select 1 from public.posts p
    where p.id = post_id
      and (p.moderation_status = 'approved' or p.author_id = auth.uid() or public.is_editorial_staff(auth.uid()))
  )
);
drop policy if exists "Post media insert" on public.post_media;
create policy "Post media insert" on public.post_media for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);

drop policy if exists "Likes read" on public.post_likes;
create policy "Likes read" on public.post_likes for select using (true);
drop policy if exists "Likes manage self" on public.post_likes;
create policy "Likes manage self" on public.post_likes for all using (auth.uid() = user_id);

drop policy if exists "Bookmarks read self" on public.bookmarks;
create policy "Bookmarks read self" on public.bookmarks for select using (auth.uid() = user_id);
drop policy if exists "Bookmarks manage self" on public.bookmarks;
create policy "Bookmarks manage self" on public.bookmarks for all using (auth.uid() = user_id);

drop policy if exists "Comments read" on public.comments;
create policy "Comments read" on public.comments for select using (is_hidden = false or public.is_editorial_staff(auth.uid()));
drop policy if exists "Comments insert auth" on public.comments;
create policy "Comments insert auth" on public.comments for insert with check (auth.uid() = author_id);

drop policy if exists "Reports insert auth" on public.content_reports;
create policy "Reports insert auth" on public.content_reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "Reports read editorial" on public.content_reports;
create policy "Reports read editorial" on public.content_reports for select using (public.is_editorial_staff(auth.uid()) or auth.uid() = reporter_id);
drop policy if exists "Reports update editorial" on public.content_reports;
create policy "Reports update editorial" on public.content_reports for update using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Businesses public read" on public.businesses;
create policy "Businesses public read" on public.businesses for select using (true);
drop policy if exists "Businesses editorial write" on public.businesses;
create policy "Businesses editorial write" on public.businesses for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Announcements public read" on public.announcements;
create policy "Announcements public read" on public.announcements for select using (true);
drop policy if exists "Announcements editorial write" on public.announcements;
create policy "Announcements editorial write" on public.announcements for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Notifications read self" on public.notifications;
create policy "Notifications read self" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "Notifications update self" on public.notifications;
create policy "Notifications update self" on public.notifications for update using (auth.uid() = user_id);

-- Roles & Categories: readable by all, editable only by Website Managers
drop policy if exists "Roles public read" on public.roles;
create policy "Roles public read" on public.roles for select using (true);
drop policy if exists "Roles manager write" on public.roles;
create policy "Roles manager write" on public.roles for all using (public.is_website_manager(auth.uid()));

drop policy if exists "Categories public read" on public.categories;
create policy "Categories public read" on public.categories for select using (true);
drop policy if exists "Categories manager write" on public.categories;
create policy "Categories manager write" on public.categories for all using (public.is_website_manager(auth.uid()));

-- Reporter Permissions & History: staff can read self, managers manage all
drop policy if exists "Permissions staff read" on public.reporter_permissions;
create policy "Permissions staff read" on public.reporter_permissions
  for select using (auth.uid() = profile_id or public.is_website_manager(auth.uid()));
drop policy if exists "Permissions manager write" on public.reporter_permissions;
create policy "Permissions manager write" on public.reporter_permissions
  for all using (public.is_website_manager(auth.uid()));

drop policy if exists "Permission history read" on public.permission_history;
create policy "Permission history read" on public.permission_history
  for select using (auth.uid() = target_profile_id or public.is_website_manager(auth.uid()));

-- Private News Tips & Evidence: STRICTLY PRIVATE until reviewed & published
drop policy if exists "News tips private read" on public.news_tips;
create policy "News tips private read" on public.news_tips
  for select using (auth.uid() = submitter_id or public.is_editorial_staff(auth.uid()));
drop policy if exists "News tips insert auth" on public.news_tips;
create policy "News tips insert auth" on public.news_tips
  for insert with check (auth.uid() = submitter_id);
drop policy if exists "News tips editorial update" on public.news_tips;
create policy "News tips editorial update" on public.news_tips
  for update using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Tip evidence private read" on public.tip_evidence;
create policy "Tip evidence private read" on public.tip_evidence
  for select using (
    public.is_editorial_staff(auth.uid()) or
    exists (select 1 from public.news_tips t where t.id = tip_id and t.submitter_id = auth.uid())
  );
drop policy if exists "Tip evidence insert submitter" on public.tip_evidence;
create policy "Tip evidence insert submitter" on public.tip_evidence
  for insert with check (
    exists (select 1 from public.news_tips t where t.id = tip_id and t.submitter_id = auth.uid())
  );

-- Media Assets: Private tip evidence restricted to owner & editors; public editorial media readable
drop policy if exists "Media assets read" on public.media_assets;
create policy "Media assets read" on public.media_assets
  for select using (
    visibility = 'public'
    or auth.uid() = owner_id
    or public.is_editorial_staff(auth.uid())
  );
drop policy if exists "Media assets insert auth" on public.media_assets;
create policy "Media assets insert auth" on public.media_assets
  for insert with check (auth.uid() = owner_id);

-- Article Revisions: readable for approved posts or editorial staff
drop policy if exists "Revisions read" on public.article_revisions;
create policy "Revisions read" on public.article_revisions
  for select using (
    moderation_status = 'approved'
    or public.is_editorial_staff(auth.uid())
  );

-- Civic Reports: private unless marked verified by editorial staff
drop policy if exists "Civic reports read" on public.civic_reports;
create policy "Civic reports read" on public.civic_reports
  for select using (
    is_public_verified = true
    or auth.uid() = reporter_id
    or public.is_editorial_staff(auth.uid())
  );
drop policy if exists "Civic reports insert auth" on public.civic_reports;
create policy "Civic reports insert auth" on public.civic_reports
  for insert with check (auth.uid() = reporter_id);
drop policy if exists "Civic reports editorial update" on public.civic_reports;
create policy "Civic reports editorial update" on public.civic_reports
  for update using (public.is_editorial_staff(auth.uid()));

-- Live Broadcasts: strictly require broadcast permission for write
drop policy if exists "Broadcasts newsroom write" on public.live_broadcasts;
create policy "Broadcasts newsroom write" on public.live_broadcasts
  for all using (public.has_reporter_permission(auth.uid(), 'live'));

-- Community Interactions (Reactions, Locality Follows, RSVPs, Live Chat, Playlists)
drop policy if exists "Reactions public read" on public.reactions;
create policy "Reactions public read" on public.reactions for select using (true);
drop policy if exists "Reactions manage self" on public.reactions;
create policy "Reactions manage self" on public.reactions for all using (auth.uid() = user_id);

drop policy if exists "Locality follows read self" on public.locality_follows;
create policy "Locality follows read self" on public.locality_follows for select using (auth.uid() = user_id);
drop policy if exists "Locality follows manage self" on public.locality_follows;
create policy "Locality follows manage self" on public.locality_follows for all using (auth.uid() = user_id);

drop policy if exists "Event RSVPs read" on public.event_rsvps;
create policy "Event RSVPs read" on public.event_rsvps for select using (true);
drop policy if exists "Event RSVPs manage self" on public.event_rsvps;
create policy "Event RSVPs manage self" on public.event_rsvps for all using (auth.uid() = user_id);

drop policy if exists "Live chat public read" on public.live_chat_messages;
create policy "Live chat public read" on public.live_chat_messages
  for select using (is_hidden = false or public.is_editorial_staff(auth.uid()));
drop policy if exists "Live chat insert auth" on public.live_chat_messages;
create policy "Live chat insert auth" on public.live_chat_messages
  for insert with check (auth.uid() = sender_id);

drop policy if exists "Playlists public read" on public.playlists;
create policy "Playlists public read" on public.playlists for select using (true);
drop policy if exists "Playlists editorial write" on public.playlists;
create policy "Playlists editorial write" on public.playlists
  for all using (public.is_editorial_staff(auth.uid()));

drop policy if exists "Playlist subs self" on public.playlist_subscriptions;
create policy "Playlist subs self" on public.playlist_subscriptions
  for all using (auth.uid() = user_id);

-- Moderation & Audit Logs: Staff only
drop policy if exists "Moderation logs editorial read" on public.moderation_logs;
create policy "Moderation logs editorial read" on public.moderation_logs
  for select using (public.is_editorial_staff(auth.uid()));
drop policy if exists "Moderation logs editorial write" on public.moderation_logs;
create policy "Moderation logs editorial write" on public.moderation_logs
  for insert with check (public.is_editorial_staff(auth.uid()));

drop policy if exists "Audit logs manager read" on public.audit_logs;
create policy "Audit logs manager read" on public.audit_logs
  for select using (public.is_website_manager(auth.uid()));

-- 11. Storage Buckets & Storage-Level Access Control (when Supabase Storage is present)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values
      ('public-editorial-media', 'public-editorial-media', true),
      ('private-tip-evidence', 'private-tip-evidence', false)
    on conflict (id) do nothing;
  end if;

  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Public editorial media read" on storage.objects';
    execute 'create policy "Public editorial media read" on storage.objects for select using (bucket_id = ''public-editorial-media'')';

    execute 'drop policy if exists "Staff upload editorial media" on storage.objects';
    execute 'create policy "Staff upload editorial media" on storage.objects for insert with check (bucket_id = ''public-editorial-media'' and public.has_reporter_permission(auth.uid(), ''media''))';

    execute 'drop policy if exists "Private tip evidence read owner or staff" on storage.objects';
    execute 'create policy "Private tip evidence read owner or staff" on storage.objects for select using (bucket_id = ''private-tip-evidence'' and (auth.uid() = owner or public.is_editorial_staff(auth.uid())))';

    execute 'drop policy if exists "Private tip evidence upload auth" on storage.objects';
    execute 'create policy "Private tip evidence upload auth" on storage.objects for insert with check (bucket_id = ''private-tip-evidence'' and auth.uid() is not null)';
  end if;
end $$;
