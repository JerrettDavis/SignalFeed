# MVP Roadmap

## M1 — Core reporting and browsing

Focus: map, sightings, simple reactions, and basic validation.

Acceptance criteria:

- Users can create sightings with type, category, description, time, and location.
- Sightings render on the map and in a list within 3 seconds.
- Users can react with emoji and mark sightings as not relevant.
- Basic spam checks and rate limits are enforced.
- Location detection centers the map with explicit permission.

## M2 — Geofences and notifications

Focus: subscriptions, public geofences, and media.

Acceptance criteria:

- Users can draw, save, and subscribe to geofences (public or private).
- Email and web push subscriptions are supported with opt-in/opt-out.
- Public geofence directory can be browsed and followed.
- Reporters can upload photos; files are size/type validated.

## M3 — Trust, extensibility, and integrations

Focus: reputation, vetting, API keys, and webhooks.

Acceptance criteria:

- Reputation events accrue based on interactions and participation.
- Vetted users can switch between raw and vetted views.
- API keys are issued with rate limits and can be revoked.
- Webhooks fire on key events (new sighting, status change).
