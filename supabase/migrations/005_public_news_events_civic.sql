-- Pethri.com Migration 005: Public discovery, event publishing, and civic tracking.
-- Additive and non-destructive; existing records are retained.

alter table public.local_events
  add column if not exists description text not null default '',
  add column if not exists ends_at timestamptz,
  add column if not exists image_url text,
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'cancelled')),
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.civic_reports
  add column if not exists verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists official_acknowledged_at timestamptz,
  add column if not exists authority_name text,
  add column if not exists official_reference text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.comments
  add column if not exists parent_comment_id uuid references public.comments(id) on delete cascade;

alter table public.civic_reports
  drop constraint if exists civic_reports_status_check;
alter table public.civic_reports
  add constraint civic_reports_status_check
  check (status in (
    'submitted', 'under_review', 'verified', 'forwarded', 'in_progress', 'resolved',
    'open', 'triaged', 'dismissed'
  ));

create table if not exists public.civic_report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.civic_reports(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_local_events_public_start
  on public.local_events(status, starts_at);
create index if not exists idx_civic_reports_reporter_created
  on public.civic_reports(reporter_id, created_at desc);
create index if not exists idx_civic_report_attachments_report
  on public.civic_report_attachments(report_id);
create index if not exists idx_comments_parent
  on public.comments(parent_comment_id);

alter table public.civic_reports
  alter column status set default 'submitted';

alter table public.civic_report_attachments enable row level security;

drop policy if exists "News tips private read" on public.news_tips;
create policy "News tips private read"
  on public.news_tips for select
  using (
    auth.uid() = submitter_id
    or public.has_reporter_permission(auth.uid(), 'tip_review')
  );

drop policy if exists "News tips editorial update" on public.news_tips;
create policy "News tips authorised review"
  on public.news_tips for update
  using (public.has_reporter_permission(auth.uid(), 'tip_review'))
  with check (public.has_reporter_permission(auth.uid(), 'tip_review'));

drop policy if exists "News tip attachments private access" on public.news_tip_attachments;
create policy "News tip attachments private access"
  on public.news_tip_attachments for select
  using (
    auth.uid() = uploaded_by
    or public.has_reporter_permission(auth.uid(), 'tip_review')
  );

drop policy if exists "Civic reports read" on public.civic_reports;
create policy "Civic reports private read"
  on public.civic_reports for select
  using (
    is_public_verified = true
    or auth.uid() = reporter_id
    or public.has_reporter_permission(auth.uid(), 'tip_review')
  );

drop policy if exists "Events public read" on public.local_events;
create policy "Events published read"
  on public.local_events for select
  using (
    status = 'published'
    or public.is_editorial_staff(auth.uid())
  );

drop policy if exists "Events editorial write" on public.local_events;
create policy "Events authorised manage"
  on public.local_events for all
  using (
    public.is_website_manager(auth.uid())
    or public.has_reporter_permission(auth.uid(), 'events')
  )
  with check (
    public.is_website_manager(auth.uid())
    or public.has_reporter_permission(auth.uid(), 'events')
  );

drop policy if exists "Event media public read" on public.event_media;
create policy "Event media published read"
  on public.event_media for select
  using (
    exists (
      select 1 from public.local_events e
      where e.id = event_id and e.status = 'published'
    )
    or public.is_editorial_staff(auth.uid())
  );

drop policy if exists "Event media staff manage" on public.event_media;
create policy "Event media authorised manage"
  on public.event_media for all
  using (
    public.is_website_manager(auth.uid())
    or public.has_reporter_permission(auth.uid(), 'events')
  )
  with check (
    public.is_website_manager(auth.uid())
    or public.has_reporter_permission(auth.uid(), 'events')
  );

drop policy if exists "Civic report attachments private read" on public.civic_report_attachments;
create policy "Civic report attachments private read"
  on public.civic_report_attachments for select
  using (
    public.has_reporter_permission(auth.uid(), 'tip_review')
    or exists (
      select 1 from public.civic_reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
  );

drop policy if exists "Civic report attachments submitter insert" on public.civic_report_attachments;
create policy "Civic report attachments submitter insert"
  on public.civic_report_attachments for insert
  with check (
    auth.uid() = uploaded_by
    and exists (
      select 1 from public.civic_reports r
      where r.id = report_id and r.reporter_id = auth.uid()
    )
  );

drop policy if exists "Civic report attachments owner or manager delete" on public.civic_report_attachments;
create policy "Civic report attachments owner or manager delete"
  on public.civic_report_attachments for delete
  using (
    auth.uid() = uploaded_by
    or public.is_website_manager(auth.uid())
  );

drop policy if exists "Civic reports editorial update" on public.civic_reports;
create policy "Civic reports authorised review"
  on public.civic_reports for update
  using (public.has_reporter_permission(auth.uid(), 'tip_review'))
  with check (public.has_reporter_permission(auth.uid(), 'tip_review'));

create or replace function public.is_editorial_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and role in ('correspondent', 'journalist', 'editor', 'admin')
      and is_suspended = false
  );
$$;

create or replace function public.is_website_manager(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin' and is_suspended = false
  );
$$;

alter table public.reporter_permissions
  add column if not exists can_manage_events boolean not null default false,
  add column if not exists can_review_tips boolean not null default false;

create or replace function public.has_reporter_permission(uid uuid, perm_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_website_manager(uid) then true
    when exists (
      select 1 from public.profiles
      where id = uid and role = 'editor' and is_suspended = false
    ) then true
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
    when perm_key = 'breaking' then coalesce(
      (select can_publish_breaking from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'moderate_comments' then coalesce(
      (select can_moderate_comments from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'events' then coalesce(
      (select can_manage_events from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'tip_review' then coalesce(
      (select can_review_tips from public.reporter_permissions where profile_id = uid), false
    )
    else false
  end;
$$;

create or replace function public.enforce_civic_report_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.status := 'submitted';
  new.is_public_verified := false;
  new.assigned_to := null;
  new.verified_by := null;
  new.verified_at := null;
  new.official_acknowledged_at := null;
  new.authority_name := null;
  new.official_reference := null;
  new.resolution_notes := null;
  new.resolved_at := null;
  if new.share_precise_location = false then
    new.precise_lat := null;
    new.precise_lng := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_civic_report_defaults on public.civic_reports;
create trigger trg_enforce_civic_report_defaults
  before insert on public.civic_reports
  for each row execute function public.enforce_civic_report_defaults();

create or replace function public.notify_civic_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.reporter_id is not null then
    insert into public.notifications (user_id, locality_id, title, message, href)
    values (
      new.reporter_id,
      new.locality_id,
      'Civic report status updated',
      'Your report status changed to ' || replace(new.status, '_', ' ') || '.',
      '/civic-reports'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_civic_report_status on public.civic_reports;
create trigger trg_notify_civic_report_status
  after update on public.civic_reports
  for each row execute function public.notify_civic_report_status_change();

create or replace function public.maintain_event_rsvp_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event uuid;
  delta integer;
begin
  if tg_op = 'DELETE' then
    target_event := old.event_id;
  else
    target_event := new.event_id;
  end if;
  if tg_op = 'INSERT' then
    delta := case when new.status = 'cancelled' then 0 else 1 end;
  elsif tg_op = 'DELETE' then
    delta := case when old.status = 'cancelled' then 0 else -1 end;
  elsif new.status is distinct from old.status then
    delta := case
      when old.status = 'cancelled' and new.status <> 'cancelled' then 1
      when old.status <> 'cancelled' and new.status = 'cancelled' then -1
      else 0
    end;
  else
    return new;
  end if;
  if delta = 0 then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  update public.local_events
  set rsvp_count = greatest(0, rsvp_count + delta)
  where id = target_event;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.notify_followers_of_published_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.moderation_status = 'approved'
     and (tg_op = 'INSERT' or old.moderation_status is distinct from new.moderation_status) then
    insert into public.notifications (user_id, locality_id, title, message, href)
    select followers.user_id,
           new.locality_id,
           'New local story',
           new.headline,
           '/article/' || new.id::text
    from (
      select lf.user_id
      from public.locality_follows lf
      where lf.locality_id = new.locality_id
      union
      select tf.user_id
      from public.topic_follows tf
      where tf.category_slug = new.category::text
    ) followers
    where followers.user_id <> new.author_id;
  end if;
  return new;
end;
$$;

create or replace function public.notify_comment_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_author uuid;
begin
  if new.parent_comment_id is not null then
    select author_id into parent_author
    from public.comments
    where id = new.parent_comment_id;
    if parent_author is not null and parent_author <> new.author_id then
      insert into public.notifications (user_id, title, message, href)
      values (
        parent_author,
        'New reply to your comment',
        left(new.content, 180),
        '/article/' || new.post_id::text
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_comment_reply on public.comments;
create trigger trg_notify_comment_reply
  after insert on public.comments
  for each row execute function public.notify_comment_reply();

create or replace function public.notify_event_attendees()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'published'
     and (old.title is distinct from new.title
       or old.starts_at is distinct from new.starts_at
       or old.venue is distinct from new.venue
       or old.status is distinct from new.status) then
    insert into public.notifications (user_id, locality_id, title, message, href)
    select r.user_id,
           new.locality_id,
           case when new.status = 'cancelled'
             then 'Event cancelled'
             else 'Event information updated'
           end,
           new.title || case when new.status = 'cancelled'
             then ' has been cancelled.'
             else ' has updated details.'
           end,
           '/directory'
    from public.event_rsvps r
    where r.event_id = new.id and r.status <> 'cancelled';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_event_attendees on public.local_events;
create trigger trg_notify_event_attendees
  after update on public.local_events
  for each row execute function public.notify_event_attendees();

drop trigger if exists trg_notify_post_followers on public.posts;
create trigger trg_notify_post_followers
  after insert or update on public.posts
  for each row execute function public.notify_followers_of_published_post();

drop trigger if exists trg_maintain_event_rsvp_count on public.event_rsvps;
create trigger trg_maintain_event_rsvp_count
  after insert or update or delete on public.event_rsvps
  for each row execute function public.maintain_event_rsvp_count();

create or replace function public.increment_post_shares(target_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set shares_count = shares_count + 1
  where id = target_post_id and moderation_status = 'approved';
  if not found then
    raise exception 'Article not found or not published.';
  end if;
end;
$$;

grant execute on function public.increment_post_shares(uuid) to anon, authenticated;

create or replace function public.maintain_post_interaction_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post uuid;
  delta integer;
begin
  if tg_op = 'DELETE' then
    target_post := old.post_id;
  else
    target_post := new.post_id;
  end if;
  delta := case when tg_op = 'INSERT' then 1 else -1 end;
  if tg_table_name = 'post_likes' then
    update public.posts set likes_count = greatest(0, likes_count + delta)
    where id = target_post;
  elsif tg_table_name = 'comments' then
    update public.posts set comments_count = greatest(0, comments_count + delta)
    where id = target_post;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_maintain_post_likes_count on public.post_likes;
create trigger trg_maintain_post_likes_count
  after insert or delete on public.post_likes
  for each row execute function public.maintain_post_interaction_counts();

drop trigger if exists trg_maintain_post_comments_count on public.comments;
create trigger trg_maintain_post_comments_count
  after insert or delete on public.comments
  for each row execute function public.maintain_post_interaction_counts();

do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Civic report evidence private access" on storage.objects';
    execute 'create policy "Civic report evidence private access" on storage.objects for select using (
      bucket_id = ''private-tip-evidence'' and (
        public.has_reporter_permission(auth.uid(), ''tip_review'') or exists (
          select 1 from public.civic_report_attachments a
          where a.storage_path = name and a.uploaded_by = auth.uid()
        ) or exists (
          select 1 from public.news_tip_attachments a
          where a.storage_path = name and a.uploaded_by = auth.uid()
        )
      )
    )';

    execute 'drop policy if exists "Civic report evidence upload owner" on storage.objects';
    execute 'create policy "Civic report evidence upload owner" on storage.objects for insert with check (
      bucket_id = ''private-tip-evidence''
      and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )';
  end if;
end $$;
