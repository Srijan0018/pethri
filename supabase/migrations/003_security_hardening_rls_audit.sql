-- Pethri.com Migration 003: Production Security Hardening, Granular RLS,
-- Anti-Self-Escalation Guards, Storage Protection & Immutable Audit Logging
--
-- SAFETY & REVERSIBILITY:
-- - Additive and idempotent only; drops NO tables and deletes NO records.
-- - Reversible by dropping the triggers/functions added below and restoring prior policies.

-- 1. Helper functions for suspended checks, granular reporter permissions & manager checks
create or replace function public.is_user_suspended(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select coalesce((select is_suspended from public.profiles where id = uid), false);
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
    when perm_key = 'breaking' then coalesce(
      (select can_publish_breaking from public.reporter_permissions where profile_id = uid), false
    )
    when perm_key = 'moderate_comments' then coalesce(
      (select can_moderate_comments from public.reporter_permissions where profile_id = uid), false
    )
    else false
  end;
$$;

-- 2. Prevent users from changing their own role or granting themselves permissions
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null then
    -- Nobody can modify their own role, verification badge, or suspension status
    if auth.uid() = new.id and (
      new.role is distinct from old.role or
      new.role_slug is distinct from old.role_slug or
      new.is_verified_reporter is distinct from old.is_verified_reporter or
      new.is_suspended is distinct from old.is_suspended
    ) then
      raise exception 'Forbidden: users cannot modify their own role or accreditation status.';
    end if;

    -- Non-managers cannot modify governance columns on any profile
    if not public.is_website_manager(auth.uid()) and (
      new.role is distinct from old.role or
      new.role_slug is distinct from old.role_slug or
      new.is_verified_reporter is distinct from old.is_verified_reporter or
      new.is_suspended is distinct from old.is_suspended or
      new.followers_count is distinct from old.followers_count
    ) then
      raise exception 'Forbidden: only a Website Manager can change roles or verification status.';
    end if;
  end if;

  if new.role is distinct from old.role then
    new.role_slug := new.role::text;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_role_escalation on public.profiles;
create trigger trg_prevent_self_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_role_escalation();

create or replace function public.prevent_self_permission_grant()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null then
    if not public.is_website_manager(auth.uid()) then
      raise exception 'Forbidden: only a Website Manager can grant or revoke reporter permissions.';
    end if;
    if auth.uid() = new.profile_id then
      raise exception 'Forbidden: managers and staff cannot modify their own permission record.';
    end if;
  end if;
  new.granted_by := coalesce(new.granted_by, auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_permission_grant on public.reporter_permissions;
create trigger trg_prevent_self_permission_grant
  before insert or update on public.reporter_permissions
  for each row execute function public.prevent_self_permission_grant();

-- 3. Enforce Private News Tips, Civic Reports & Live Broadcast Staff Rules
create or replace function public.enforce_private_tip_defaults()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.is_editorial_staff(auth.uid()) then
    new.status := 'submitted';
    new.assigned_editor_id := null;
    new.moderation_notes := null;
    new.published_post_id := null;
    new.reviewed_at := null;
  end if;
  if new.share_precise_location = false then
    new.precise_lat := null;
    new.precise_lng := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_private_tip_defaults on public.news_tips;
create trigger trg_enforce_private_tip_defaults
  before insert on public.news_tips
  for each row execute function public.enforce_private_tip_defaults();

create or replace function public.enforce_civic_report_defaults()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.is_editorial_staff(auth.uid()) then
    new.status := 'open';
    new.is_public_verified := false;
    new.assigned_to := null;
    new.resolution_notes := null;
    new.resolved_at := null;
  end if;
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

create or replace function public.enforce_broadcast_staff_only()
returns trigger
language plpgsql
security definer
as $$
begin
  if auth.uid() is not null and not public.has_reporter_permission(auth.uid(), 'live') then
    raise exception 'Forbidden: only authorised staff with broadcast permission can manage live broadcasts.';
  end if;
  new.stream_source_kind := 'official_newsroom';
  return new;
end;
$$;

drop trigger if exists trg_enforce_broadcast_staff_only on public.live_broadcasts;
create trigger trg_enforce_broadcast_staff_only
  before insert or update on public.live_broadcasts
  for each row execute function public.enforce_broadcast_staff_only();

-- 4. Immutable Security Audit Logging Triggers (Publishing, Permissions, Broadcasts, Roles)
create or replace function public.prevent_audit_log_tampering()
returns trigger
language plpgsql
security definer
as $$
begin
  raise exception 'Forbidden: security audit and moderation logs are append-only and cannot be modified or deleted.';
end;
$$;

drop trigger if exists trg_immutable_audit_logs on public.audit_logs;
create trigger trg_immutable_audit_logs
  before update or delete on public.audit_logs
  for each row execute function public.prevent_audit_log_tampering();

drop trigger if exists trg_immutable_permission_history on public.permission_history;
create trigger trg_immutable_permission_history
  before update or delete on public.permission_history
  for each row execute function public.prevent_audit_log_tampering();

drop trigger if exists trg_immutable_moderation_logs on public.moderation_logs;
create trigger trg_immutable_moderation_logs
  before update or delete on public.moderation_logs
  for each row execute function public.prevent_audit_log_tampering();

create or replace function public.log_post_audit_event()
returns trigger
language plpgsql
security definer
as $$
declare
  act text;
begin
  if tg_op = 'INSERT' then
    act := case when new.source_kind in ('newsroom', 'sponsored') then 'article_published' else 'citizen_post_submitted' end;
    insert into public.audit_logs (actor_id, action, entity_table, entity_id, metadata)
    values (
      coalesce(auth.uid(), new.author_id),
      act,
      'posts',
      new.id::text,
      jsonb_build_object(
        'source_kind', new.source_kind,
        'moderation_status', new.moderation_status,
        'verification_tier', new.verification_tier,
        'is_breaking', new.is_breaking,
        'locality_id', new.locality_id
      )
    );
    return new;
  elsif tg_op = 'UPDATE' then
    if new.moderation_status is distinct from old.moderation_status or
       new.verification_tier is distinct from old.verification_tier or
       new.is_breaking is distinct from old.is_breaking then
      insert into public.audit_logs (actor_id, action, entity_table, entity_id, metadata)
      values (
        coalesce(auth.uid(), new.reviewed_by, new.author_id),
        'article_editorial_update',
        'posts',
        new.id::text,
        jsonb_build_object(
          'prev_status', old.moderation_status,
          'new_status', new.moderation_status,
          'prev_tier', old.verification_tier,
          'new_tier', new.verification_tier,
          'is_breaking', new.is_breaking
        )
      );
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_logs (actor_id, action, entity_table, entity_id, metadata)
    values (
      coalesce(auth.uid(), old.author_id),
      'article_deleted',
      'posts',
      old.id::text,
      jsonb_build_object('headline', old.headline)
    );
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_post_audit_event on public.posts;
create trigger trg_log_post_audit_event
  after insert or update or delete on public.posts
  for each row execute function public.log_post_audit_event();

create or replace function public.log_broadcast_audit_event()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_table, entity_id, metadata)
  values (
    coalesce(auth.uid(), new.host_id),
    case when new.is_live then 'broadcast_started_or_live' else 'broadcast_updated_or_ended' end,
    'live_broadcasts',
    new.id::text,
    jsonb_build_object('is_live', new.is_live, 'title', new.title, 'locality_id', new.locality_id)
  );
  return new;
end;
$$;

drop trigger if exists trg_log_broadcast_audit_event on public.live_broadcasts;
create trigger trg_log_broadcast_audit_event
  after insert or update on public.live_broadcasts
  for each row execute function public.log_broadcast_audit_event();

create or replace function public.log_profile_role_audit_event()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role is distinct from old.role or
     new.is_verified_reporter is distinct from old.is_verified_reporter or
     new.is_suspended is distinct from old.is_suspended then
    insert into public.audit_logs (actor_id, action, entity_table, entity_id, metadata)
    values (
      coalesce(auth.uid(), new.id),
      'profile_role_or_status_changed',
      'profiles',
      new.id::text,
      jsonb_build_object(
        'prev_role', old.role,
        'new_role', new.role,
        'prev_verified', old.is_verified_reporter,
        'new_verified', new.is_verified_reporter,
        'prev_suspended', old.is_suspended,
        'new_suspended', new.is_suspended
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_profile_role_audit on public.profiles;
create trigger trg_log_profile_role_audit
  after update on public.profiles
  for each row execute function public.log_profile_role_audit_event();

-- 5. Tighten RLS Policies Across All Interactive, Moderation & Storage Tables
drop policy if exists "Profiles insert self" on public.profiles;
create policy "Profiles insert self" on public.profiles
  for insert with check (
    auth.uid() = id
    and role = 'citizen'
    and is_verified_reporter = false
    and is_suspended = false
  );

drop policy if exists "Comments insert auth" on public.comments;
create policy "Comments insert auth" on public.comments
  for insert with check (
    auth.uid() = author_id
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.moderation_status = 'approved'
    )
  );

drop policy if exists "Comments staff moderate" on public.comments;
create policy "Comments staff moderate" on public.comments
  for update using (
    public.has_reporter_permission(auth.uid(), 'moderate_comments')
    or public.is_editorial_staff(auth.uid())
  );

drop policy if exists "Likes manage self" on public.post_likes;
create policy "Likes manage self" on public.post_likes
  for all using (
    auth.uid() = user_id
    and not public.is_user_suspended(auth.uid())
  ) with check (
    auth.uid() = user_id
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.moderation_status = 'approved'
    )
  );

drop policy if exists "Reactions manage self" on public.reactions;
create policy "Reactions manage self" on public.reactions
  for all using (
    auth.uid() = user_id
    and not public.is_user_suspended(auth.uid())
  ) with check (
    auth.uid() = user_id
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.moderation_status = 'approved'
    )
  );

drop policy if exists "Bookmarks manage self" on public.bookmarks;
create policy "Bookmarks manage self" on public.bookmarks
  for all using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_id and p.moderation_status = 'approved'
    )
  );

drop policy if exists "Reports insert auth" on public.content_reports;
create policy "Reports insert auth" on public.content_reports
  for insert with check (
    auth.uid() = reporter_id
    and not public.is_user_suspended(auth.uid())
  );

drop policy if exists "Posts insert authenticated" on public.posts;
create policy "Posts insert authenticated" on public.posts
  for insert with check (
    auth.uid() = author_id
    and not public.is_user_suspended(auth.uid())
    and (
      public.has_reporter_permission(auth.uid(), 'publish')
      or (
        source_kind = 'citizen'
        and verification_tier = 'community'
        and moderation_status = 'pending'
        and is_breaking = false
      )
    )
  );

drop policy if exists "Posts update author or editor" on public.posts;
create policy "Posts update author or editor" on public.posts
  for update using (
    (auth.uid() = author_id and moderation_status = 'pending' and not public.is_user_suspended(auth.uid()))
    or public.is_editorial_staff(auth.uid())
  );

-- Storage Hardening: enforce Delete/Update protections in private & official buckets
do $$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists "Staff manage official editorial media" on storage.objects';
    execute 'create policy "Staff manage official editorial media" on storage.objects for update using (bucket_id = ''public-editorial-media'' and public.has_reporter_permission(auth.uid(), ''media''))';

    execute 'drop policy if exists "Staff delete official editorial media" on storage.objects';
    execute 'create policy "Staff delete official editorial media" on storage.objects for delete using (bucket_id = ''public-editorial-media'' and public.is_website_manager(auth.uid()))';

    execute 'drop policy if exists "Private tip evidence delete owner or manager" on storage.objects';
    execute 'create policy "Private tip evidence delete owner or manager" on storage.objects for delete using (bucket_id = ''private-tip-evidence'' and (auth.uid() = owner or public.is_website_manager(auth.uid())))';
  end if;
end $$;
