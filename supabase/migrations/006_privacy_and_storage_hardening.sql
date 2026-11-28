-- Restrict direct table access to personal civic and social-graph records.
drop policy if exists "Civic reports read" on public.civic_reports;
drop policy if exists "Civic reports private read" on public.civic_reports;
create policy "Civic reports private read"
  on public.civic_reports for select
  using (
    auth.uid() = reporter_id
    or public.has_reporter_permission(auth.uid(), 'tip_review')
  );

drop policy if exists "Event RSVPs read" on public.event_rsvps;
create policy "Event RSVPs read self"
  on public.event_rsvps for select
  using (auth.uid() = user_id);

drop policy if exists "Follows read" on public.user_follows;
create policy "Follows read self"
  on public.user_follows for select
  using (auth.uid() = follower_id);

drop policy if exists "Profiles insert self" on public.profiles;
create policy "Profiles insert self"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'citizen'
    and role_slug = 'citizen'
    and is_verified_reporter = false
    and is_suspended = false
  );

-- A pre-existing bucket must not retain an accidental public setting.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set public = false
    where id = 'private-tip-evidence';
  end if;
end $$;

revoke all on function public.increment_post_shares(uuid) from public, anon;
grant execute on function public.increment_post_shares(uuid) to authenticated;
