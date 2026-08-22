INSERT INTO locations (id, name, category, description, latitude, longitude, availability)
VALUES
  ('first-gate', 'First Gate', 'ENTRANCE', 'Campus entrance.', 16.542800, 81.495704, 'UNKNOWN'),
  ('second-gate', 'Second Gate', 'ENTRANCE', 'Campus entrance.', 16.542296, 81.497089, 'UNKNOWN'),
  ('third-gate', 'Third Gate', 'ENTRANCE', 'Campus entrance.', 16.545310, 81.495254, 'UNKNOWN'),
  ('library', 'Library', 'STUDY', 'Campus study facility.', 16.543220, 81.495805, 'UNKNOWN'),
  ('open-auditorium', 'Open Auditorium', 'EVENTS', 'Campus events venue.', 16.543460, 81.496468, 'UNKNOWN'),
  ('auditorium', 'Auditorium', 'EVENTS', 'Campus events venue.', 16.544907, 81.495630, 'UNKNOWN'),
  ('ground', 'Ground', 'SPORTS', 'Campus sports area.', 16.544774, 81.496776, 'UNKNOWN'),
  ('cafeteria', 'Cafeteria', 'FOOD', 'Campus food facility.', 16.545356, 81.495719, 'UNKNOWN'),
  ('food-court', 'Food Court', 'FOOD', 'Campus food facility.', 16.545545, 81.495708, 'UNKNOWN'),
  ('store', 'Store', 'SHOPPING', 'Campus shopping facility.', 16.545247, 81.495276, 'UNKNOWN'),
  ('srujana-vatika', 'Srujana Vatika', 'RECREATION', 'Campus recreation area.', 16.545939, 81.496250, 'UNKNOWN'),
  ('volleyball-court', 'Volleyball Court', 'SPORTS', 'Campus sports area.', 16.545172, 81.497080, 'UNKNOWN'),
  ('open-gym', 'Open Gym', 'FITNESS', 'Campus fitness area.', 16.545172, 81.497080, 'UNKNOWN'),
  ('gym', 'Gym', 'FITNESS', 'Campus fitness facility.', 16.545232, 81.496707, 'UNKNOWN')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  availability = EXCLUDED.availability,
  updated_at = NOW();

INSERT INTO facilities (id, name, type, location_id)
VALUES
  ('library', 'Library', 'STUDY', 'library'),
  ('cafeteria', 'Cafeteria', 'FOOD', 'cafeteria'),
  ('volleyball-court', 'Volleyball Court', 'SPORTS', 'volleyball-court'),
  ('gym', 'Gym', 'FITNESS', 'gym')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  location_id = EXCLUDED.location_id,
  updated_at = NOW();

-- TODO: Verify Open Gym coordinate if physically separate from Volleyball Court.