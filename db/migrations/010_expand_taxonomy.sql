-- Migration: Expand taxonomy with additional categories and sighting types
-- This migration adds new categories, subcategories, and sighting types to support
-- broader community use cases and enhance flair applicability

-- ============================================================================
-- NEW CATEGORIES
-- ============================================================================

INSERT INTO categories (id, label, icon, description) VALUES
  ('cat-health-wellness', 'Health & Wellness', '🏥', 'Medical facilities, health services, wellness resources'),
  ('cat-education', 'Education', '📚', 'School activities, educational resources, learning opportunities'),
  ('cat-entertainment', 'Entertainment', '🎭', 'Live performances, shows, concerts, entertainment venues'),
  ('cat-sports-recreation', 'Sports & Recreation', '⚽', 'Sports events, recreational activities, fitness opportunities'),
  ('cat-business', 'Business', '💼', 'Business openings, closures, sales, commercial activity'),
  ('cat-real-estate', 'Real Estate', '🏠', 'Property listings, open houses, neighborhood changes'),
  ('cat-environmental', 'Environmental', '🌱', 'Environmental issues, conservation, sustainability efforts'),
  ('cat-technology', 'Technology', '💻', 'Tech events, digital infrastructure, connectivity issues');

-- ============================================================================
-- NEW SUBCATEGORIES
-- ============================================================================

-- Health & Wellness subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-emergency-medical', 'Emergency Medical', 'cat-health-wellness', 'Ambulance, medical emergencies'),
  ('subcat-health-services', 'Health Services', 'cat-health-wellness', 'Clinics, pharmacies, testing sites'),
  ('subcat-mental-health', 'Mental Health', 'cat-health-wellness', 'Counseling, support groups, resources'),
  ('subcat-fitness', 'Fitness', 'cat-health-wellness', 'Gyms, workout groups, fitness events');

-- Education subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-schools', 'Schools', 'cat-education', 'School activities, closures, events'),
  ('subcat-libraries', 'Libraries', 'cat-education', 'Library programs, book sales, resources'),
  ('subcat-workshops', 'Workshops', 'cat-education', 'Educational workshops and classes'),
  ('subcat-tutoring', 'Tutoring', 'cat-education', 'Tutoring services and study groups');

-- Entertainment subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-live-music', 'Live Music', 'cat-entertainment', 'Concerts, bands, live performances'),
  ('subcat-theater', 'Theater', 'cat-entertainment', 'Plays, performances, theatrical shows'),
  ('subcat-comedy', 'Comedy', 'cat-entertainment', 'Comedy shows, stand-up, improv'),
  ('subcat-movies', 'Movies', 'cat-entertainment', 'Movie screenings, outdoor cinema, film events');

-- Sports & Recreation subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-team-sports', 'Team Sports', 'cat-sports-recreation', 'Local games, leagues, team activities'),
  ('subcat-outdoor-activities', 'Outdoor Activities', 'cat-sports-recreation', 'Hiking, biking, outdoor adventures'),
  ('subcat-water-sports', 'Water Sports', 'cat-sports-recreation', 'Swimming, kayaking, water activities'),
  ('subcat-extreme-sports', 'Extreme Sports', 'cat-sports-recreation', 'Skateboarding, BMX, extreme activities');

-- Business subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-openings', 'New Openings', 'cat-business', 'New business openings, grand openings'),
  ('subcat-closures', 'Closures', 'cat-business', 'Business closures, last days'),
  ('subcat-sales-deals', 'Sales & Deals', 'cat-business', 'Special sales, promotions, deals'),
  ('subcat-hiring', 'Hiring', 'cat-business', 'Now hiring signs, job fairs');

-- Real Estate subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-open-houses', 'Open Houses', 'cat-real-estate', 'Open house events'),
  ('subcat-for-sale', 'For Sale', 'cat-real-estate', 'Properties for sale'),
  ('subcat-for-rent', 'For Rent', 'cat-real-estate', 'Rental properties'),
  ('subcat-construction-dev', 'Construction & Development', 'cat-real-estate', 'New developments, construction');

-- Environmental subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-pollution', 'Pollution', 'cat-environmental', 'Air, water, noise pollution'),
  ('subcat-recycling', 'Recycling', 'cat-environmental', 'Recycling events, facilities'),
  ('subcat-conservation', 'Conservation', 'cat-environmental', 'Conservation efforts, cleanups'),
  ('subcat-invasive-species', 'Invasive Species', 'cat-environmental', 'Invasive plant and animal reports');

-- Technology subcategories
INSERT INTO subcategories (id, label, category_id, description) VALUES
  ('subcat-internet-outage', 'Internet Outage', 'cat-technology', 'ISP outages, connectivity issues'),
  ('subcat-tech-events', 'Tech Events', 'cat-technology', 'Hackathons, tech meetups, launches'),
  ('subcat-charging-stations', 'Charging Stations', 'cat-technology', 'EV charging, power banks, USB ports'),
  ('subcat-smart-city', 'Smart City', 'cat-technology', 'Smart infrastructure, IoT, digital services');

-- ============================================================================
-- NEW SIGHTING TYPES
-- ============================================================================

-- Health & Wellness sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-ambulance', 'Ambulance Response', 'cat-health-wellness', 'subcat-emergency-medical', '["emergency","medical","first-responder"]', '🚑'),
  ('type-mobile-clinic', 'Mobile Clinic', 'cat-health-wellness', 'subcat-health-services', '["health","clinic","community"]', '🏥'),
  ('type-covid-testing', 'COVID Testing Site', 'cat-health-wellness', 'subcat-health-services', '["health","testing","covid"]', '🧪'),
  ('type-vaccine-clinic', 'Vaccine Clinic', 'cat-health-wellness', 'subcat-health-services', '["health","vaccine","clinic"]', '💉'),
  ('type-mental-health-resource', 'Mental Health Resource', 'cat-health-wellness', 'subcat-mental-health', '["mental-health","support","resource"]', '🧠'),
  ('type-outdoor-workout', 'Outdoor Workout Group', 'cat-health-wellness', 'subcat-fitness', '["fitness","workout","community"]', '🏃');

-- Education sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-school-bus', 'School Bus Activity', 'cat-education', 'subcat-schools', '["school","bus","children"]', '🚌'),
  ('type-school-event', 'School Event', 'cat-education', 'subcat-schools', '["school","event","education"]', '🏫'),
  ('type-book-sale', 'Library Book Sale', 'cat-education', 'subcat-libraries', '["books","sale","library"]', '📚'),
  ('type-story-time', 'Story Time', 'cat-education', 'subcat-libraries', '["children","library","reading"]', '📖'),
  ('type-workshop', 'Educational Workshop', 'cat-education', 'subcat-workshops', '["workshop","learning","education"]', '👨‍🏫'),
  ('type-coding-bootcamp', 'Coding Bootcamp', 'cat-education', 'subcat-workshops', '["coding","tech","learning"]', '💻');

-- Entertainment sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-street-musician', 'Street Musician', 'cat-entertainment', 'subcat-live-music', '["music","busking","performance"]', '🎸'),
  ('type-concert', 'Concert', 'cat-entertainment', 'subcat-live-music', '["music","concert","entertainment"]', '🎤'),
  ('type-local-band', 'Local Band Performance', 'cat-entertainment', 'subcat-live-music', '["music","band","local"]', '🎵'),
  ('type-theater-show', 'Theater Show', 'cat-entertainment', 'subcat-theater', '["theater","performance","show"]', '🎭'),
  ('type-comedy-show', 'Comedy Show', 'cat-entertainment', 'subcat-comedy', '["comedy","entertainment","show"]', '😂'),
  ('type-outdoor-movie', 'Outdoor Movie', 'cat-entertainment', 'subcat-movies', '["movie","outdoor","film"]', '🎬');

-- Sports & Recreation sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-pickup-game', 'Pickup Game', 'cat-sports-recreation', 'subcat-team-sports', '["sports","game","community"]', '🏀'),
  ('type-youth-sports', 'Youth Sports Game', 'cat-sports-recreation', 'subcat-team-sports', '["sports","youth","game"]', '⚽'),
  ('type-running-group', 'Running Group', 'cat-sports-recreation', 'subcat-outdoor-activities', '["running","fitness","group"]', '🏃'),
  ('type-bike-ride', 'Group Bike Ride', 'cat-sports-recreation', 'subcat-outdoor-activities', '["biking","cycling","group"]', '🚴'),
  ('type-hiking-group', 'Hiking Group', 'cat-sports-recreation', 'subcat-outdoor-activities', '["hiking","outdoor","nature"]', '🥾'),
  ('type-kayaking', 'Kayaking Activity', 'cat-sports-recreation', 'subcat-water-sports', '["water","kayaking","outdoor"]', '🚣'),
  ('type-skate-session', 'Skate Session', 'cat-sports-recreation', 'subcat-extreme-sports', '["skating","skateboard","extreme"]', '🛹');

-- Business sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-grand-opening', 'Grand Opening', 'cat-business', 'subcat-openings', '["business","opening","new"]', '🎉'),
  ('type-soft-opening', 'Soft Opening', 'cat-business', 'subcat-openings', '["business","opening","preview"]', '🏪'),
  ('type-going-out-business', 'Going Out of Business', 'cat-business', 'subcat-closures', '["business","closure","sale"]', '📉'),
  ('type-flash-sale', 'Flash Sale', 'cat-business', 'subcat-sales-deals', '["sale","deal","shopping"]', '💰'),
  ('type-clearance-sale', 'Clearance Sale', 'cat-business', 'subcat-sales-deals', '["sale","clearance","shopping"]', '🏷️'),
  ('type-now-hiring', 'Now Hiring Sign', 'cat-business', 'subcat-hiring', '["hiring","jobs","employment"]', '📋');

-- Real Estate sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-open-house', 'Open House', 'cat-real-estate', 'subcat-open-houses', '["real-estate","open-house","home"]', '🏡'),
  ('type-for-sale-sign', 'For Sale Sign', 'cat-real-estate', 'subcat-for-sale', '["real-estate","sale","property"]', '🏠'),
  ('type-for-rent-sign', 'For Rent Sign', 'cat-real-estate', 'subcat-for-rent', '["real-estate","rent","property"]', '🏘️'),
  ('type-new-development', 'New Development', 'cat-real-estate', 'subcat-construction-dev', '["construction","development","real-estate"]', '🏗️'),
  ('type-demolition', 'Building Demolition', 'cat-real-estate', 'subcat-construction-dev', '["demolition","construction","development"]', '💥');

-- Environmental sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-air-quality', 'Poor Air Quality', 'cat-environmental', 'subcat-pollution', '["environment","air","pollution"]', '😷'),
  ('type-water-pollution', 'Water Pollution', 'cat-environmental', 'subcat-pollution', '["environment","water","pollution"]', '💧'),
  ('type-noise-pollution', 'Noise Pollution', 'cat-environmental', 'subcat-pollution', '["environment","noise","pollution"]', '🔊'),
  ('type-recycling-event', 'Recycling Event', 'cat-environmental', 'subcat-recycling', '["recycling","environment","event"]', '♻️'),
  ('type-community-cleanup', 'Community Cleanup', 'cat-environmental', 'subcat-conservation', '["cleanup","environment","community"]', '🧹'),
  ('type-tree-planting', 'Tree Planting', 'cat-environmental', 'subcat-conservation', '["trees","environment","conservation"]', '🌳'),
  ('type-invasive-plant', 'Invasive Plant', 'cat-environmental', 'subcat-invasive-species', '["invasive","plant","environment"]', '🌿');

-- Technology sighting types
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  ('type-internet-down', 'Internet Down', 'cat-technology', 'subcat-internet-outage', '["internet","outage","connectivity"]', '📡'),
  ('type-cell-outage', 'Cell Service Outage', 'cat-technology', 'subcat-internet-outage', '["cellular","outage","connectivity"]', '📱'),
  ('type-hackathon', 'Hackathon', 'cat-technology', 'subcat-tech-events', '["tech","hackathon","coding"]', '💻'),
  ('type-tech-meetup', 'Tech Meetup', 'cat-technology', 'subcat-tech-events', '["tech","meetup","networking"]', '🤝'),
  ('type-ev-charging', 'EV Charging Station', 'cat-technology', 'subcat-charging-stations', '["ev","charging","electric"]', '🔌'),
  ('type-public-wifi', 'Free Public WiFi', 'cat-technology', 'subcat-internet-outage', '["wifi","internet","free"]', '📶'),
  ('type-smart-kiosk', 'Smart City Kiosk', 'cat-technology', 'subcat-smart-city', '["smart-city","kiosk","digital"]', '🖥️');

-- Add more types to existing categories
INSERT INTO sighting_types (id, label, category_id, subcategory_id, tags, icon) VALUES
  -- Additional Transportation types
  ('type-bike-share', 'Bike Share Station', 'cat-transportation', NULL, '["bike","sharing","transportation"]', '🚲'),
  ('type-scooter-share', 'Scooter Share', 'cat-transportation', NULL, '["scooter","sharing","transportation"]', '🛴'),
  ('type-rideshare-staging', 'Rideshare Staging Area', 'cat-transportation', NULL, '["rideshare","uber","lyft"]', '🚕'),

  -- Additional Wildlife types
  ('type-rare-bird', 'Rare Bird Sighting', 'cat-wildlife', NULL, '["bird","rare","wildlife"]', '🦅'),
  ('type-injured-animal', 'Injured Animal', 'cat-wildlife', NULL, '["animal","injured","wildlife"]', '🩹'),
  ('type-animal-crossing', 'Animal Crossing', 'cat-wildlife', NULL, '["animal","crossing","wildlife"]', '🦌'),

  -- Additional Food & Drink types
  ('type-pop-up-restaurant', 'Pop-up Restaurant', 'cat-food-drink', NULL, '["food","popup","restaurant"]', '🍽️'),
  ('type-food-giveaway', 'Free Food Giveaway', 'cat-food-drink', NULL, '["food","free","community"]', '🍲'),
  ('type-happy-hour', 'Happy Hour Special', 'cat-food-drink', NULL, '["drinks","happy-hour","deal"]', '🍻');

-- ============================================================================
-- UPDATE DECAY CONFIGS FOR NEW CATEGORIES
-- ============================================================================

INSERT INTO category_decay_config (category_id, decay_rate, relevance_window_hours, notes) VALUES
  ('cat-health-wellness', 1.6, 48, 'Health services need timely visibility'),
  ('cat-education', 1.5, 72, 'Educational events have moderate duration'),
  ('cat-entertainment', 1.8, 24, 'Entertainment events are time-sensitive'),
  ('cat-sports-recreation', 1.7, 36, 'Sports and rec activities have day-level relevance'),
  ('cat-business', 1.4, 168, 'Business changes stay relevant for a week'),
  ('cat-real-estate', 1.0, 336, 'Real estate listings persist for weeks'),
  ('cat-environmental', 1.1, 240, 'Environmental issues need extended visibility'),
  ('cat-technology', 1.9, 12, 'Tech issues are urgent and time-sensitive');
