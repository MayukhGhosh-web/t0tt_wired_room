-- supabase/migrations/20260924000000_wire_room_features.sql

ALTER TABLE clusters ADD COLUMN IF NOT EXISTS category text default 'WORLD';
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS heat_index integer default 50;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS velocity numeric(3,1) default 0.1;
ALTER TABLE clusters ADD COLUMN IF NOT EXISTS political_spectrum jsonb default '{"left": 0, "center": 100, "right": 0}'::jsonb;
