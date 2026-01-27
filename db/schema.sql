create table if not exists sightings (
  id text primary key,
  type_id text not null,
  category_id text not null,
  location_lat double precision not null,
  location_lng double precision not null,
  description text not null,
  details text,
  importance text not null,
  status text not null,
  observed_at timestamptz not null,
  created_at timestamptz not null,
  fields jsonb not null default '{}'::jsonb,
  reporter_id text
);

create table if not exists geofences (
  id text primary key,
  name text not null,
  visibility text not null,
  polygon jsonb not null,
  created_at timestamptz not null,
  owner_id text
);

create table if not exists subscriptions (
  id text primary key,
  email text not null,
  target_kind text not null,
  geofence_id text,
  polygon jsonb,
  category_ids jsonb not null default '[]'::jsonb,
  type_ids jsonb not null default '[]'::jsonb,
  trust_level text not null,
  created_at timestamptz not null
);

create index if not exists idx_sightings_status on sightings (status);
create index if not exists idx_sightings_type_id on sightings (type_id);
create index if not exists idx_sightings_category_id on sightings (category_id);
create index if not exists idx_geofences_visibility on geofences (visibility);
create index if not exists idx_subscriptions_email on subscriptions (email);
