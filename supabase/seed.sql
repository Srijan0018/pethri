-- Pethri.com Idempotent Seed Data (Karavali Belt)
-- Safe to execute multiple times: uses deterministic UUIDs + ON CONFLICT DO NOTHING.

-- 1. Karavali Localities
insert into public.localities (
  id, slug, name, name_kn, taluk, district, pincode, center_lat, center_lng, description, active_reporters, is_primary
) values
  ('10000000-0000-4000-8000-000000000001', 'pethri', 'Pethri', 'ಪೆತ್ರಿ', 'Brahmavar', 'Udupi', '576213', 13.4510, 74.8120, 'Pethri & Cherkady editorial hub covering panchayat civic news, parish feasts, paddy farming, and feeder bus corridors.', 9, true),
  ('10000000-0000-4000-8000-000000000002', 'mangaluru', 'Mangaluru', 'ಮಂಗಳೂರು', 'Mangaluru', 'Dakshina Kannada', '575001', 12.9141, 74.8560, 'Coastal metropolitan desk covering Hampankatta, Kadri, Panambur port, civic infrastructure, and cultural festivals.', 18, false),
  ('10000000-0000-4000-8000-000000000003', 'udupi', 'Udupi', 'ಉಡುಪಿ', 'Udupi', 'Udupi', '576101', 13.3409, 74.7421, 'District headquarters covering Krishna Matha events, Malpe fisheries harbour, and district civic briefings.', 14, false),
  ('10000000-0000-4000-8000-000000000004', 'manipal', 'Manipal', 'ಮಣಿಪಾಲ', 'Udupi', 'Udupi', '576104', 13.3525, 74.7928, 'University town desk covering college fests, End Point, health alerts, and transit links.', 11, false),
  ('10000000-0000-4000-8000-000000000005', 'kundapura', 'Kundapura', 'ಕುಂದಾಪುರ', 'Kundapura', 'Udupi', '576201', 13.6213, 74.6914, 'Northern coastal desk covering Kundapura market, NH-66 highway junctions, and Gangolli harbour updates.', 8, false),
  ('10000000-0000-4000-8000-000000000006', 'brahmavar', 'Brahmavar', 'ಬ್ರಹ್ಮಾವರ', 'Brahmavar', 'Udupi', '576213', 13.4339, 74.7453, 'Brahmavar taluk centre covering sugar factory road, sports tournaments, and agricultural markets.', 7, false),
  ('10000000-0000-4000-8000-000000000007', 'barkur', 'Barkur', 'ಬಾರ್ಕೂರು', 'Brahmavar', 'Udupi', '576210', 13.4673, 74.7219, 'Historic temple and Sita river belt covering heritage celebrations and rural road connectivity.', 5, false)
on conflict (slug) do nothing;

-- 2. Editorial Video Playlists
insert into public.playlists (id, slug, title, description, cover_url, subscribers_count)
values
  ('20000000-0000-4000-8000-000000000001', 'coastal-newsroom', 'Karavali Evening Bulletins', 'Verified daily video briefs from Mangaluru, Udupi, Manipal & Pethri.', '/images/photos/pethri-town.jpg', 4280),
  ('20000000-0000-4000-8000-000000000002', 'kambala-kabaddi', 'Karavali Sports & Kabaddi', 'Floodlit pro-style rural Kabaddi, Kambala tracks, and school athletics.', '/images/photos/local-sports.jpg', 3190),
  ('20000000-0000-4000-8000-000000000003', 'parish-feasts', 'Church Feasts & Heritage', 'Liturgical feasts, Yakshagana nights, and parish processions across the coast.', '/images/photos/church-feast.jpg', 2740),
  ('20000000-0000-4000-8000-000000000004', 'krishi-harvest', 'Paddy, Arecanut & Dairy', 'Monsoon paddy yields, Krishi Bhavan advisories, and local cooperatives.', '/images/photos/paddy-harvest.jpg', 1980)
on conflict (slug) do nothing;

-- 3. Standalone Demo Staff/Community Profiles (only seeded if auth.users FK is absent)
do $$
begin
  if to_regclass('auth.users') is null then
    insert into public.profiles (id, username, full_name, avatar_url, bio, role, role_slug, home_locality_id, is_verified_reporter, followers_count)
    values
      ('30000000-0000-4000-8000-000000000001', 'pethri_editor', 'Pethri Editorial Desk', '/images/scenes/avatar-editor.svg', 'Chief Newsroom Desk for Mangaluru, Udupi, Manipal & Pethri.', 'editor', 'editor', '10000000-0000-4000-8000-000000000001', true, 12450),
      ('30000000-0000-4000-8000-000000000002', 'ananya_news', 'Ananya Pai', '/images/scenes/avatar-ananya.svg', 'Accredited Karavali civic & infrastructure journalist.', 'journalist', 'journalist', '10000000-0000-4000-8000-000000000002', true, 3890),
      ('30000000-0000-4000-8000-000000000003', 'roshan_pethri', 'Roshan D''Souza', '/images/scenes/avatar-roshan.svg', 'Pethri & Brahmavar community correspondent covering parish and road updates.', 'correspondent', 'correspondent', '10000000-0000-4000-8000-000000000001', true, 920),
      ('30000000-0000-4000-8000-000000000004', 'kavitha_agri', 'Kavitha Shetty', '/images/scenes/avatar-kavitha.svg', 'Cherkady paddy farmer & local citizen contributor.', 'citizen', 'citizen', '10000000-0000-4000-8000-000000000001', false, 310)
    on conflict (username) do nothing;

    insert into public.reporter_permissions (
      profile_id, can_publish_articles, can_upload_official_media, can_start_broadcasts, can_publish_breaking, can_moderate_comments, granted_by, notes
    ) values
      ('30000000-0000-4000-8000-000000000001', true, true, true, true, true, '30000000-0000-4000-8000-000000000001', 'Editorial Lead default permissions'),
      ('30000000-0000-4000-8000-000000000002', true, true, false, false, true, '30000000-0000-4000-8000-000000000001', 'Accredited Journalist publishing & official media'),
      ('30000000-0000-4000-8000-000000000003', false, false, false, false, false, '30000000-0000-4000-8000-000000000001', 'Field Reporter draft-only until Website Manager approval')
    on conflict (profile_id) do nothing;
  end if;
end $$;
