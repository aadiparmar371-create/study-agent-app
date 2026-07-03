-- This file should be run in Supabase SQL Editor
-- Create a function to upsert concepts that bypasses RLS restrictions

CREATE OR REPLACE FUNCTION upsert_concept(
  p_subject text,
  p_concept text,
  p_mastery_level text DEFAULT '',
  p_overview_gist text DEFAULT '',
  p_deep_dive_gist text[] DEFAULT '{}',
  p_strong_areas text[] DEFAULT '{}',
  p_weak_areas text[] DEFAULT '{}',
  p_next_steps text[] DEFAULT '{}',
  p_notes text DEFAULT ''
)
RETURNS SETOF concepts AS $$
BEGIN
  RETURN QUERY
  INSERT INTO concepts (
    subject,
    concept,
    mastery_level,
    overview_gist,
    deep_dive_gist,
    strong_areas,
    weak_areas,
    next_steps,
    notes,
    last_updated
  ) VALUES (
    p_subject,
    p_concept,
    p_mastery_level,
    p_overview_gist,
    p_deep_dive_gist,
    p_strong_areas,
    p_weak_areas,
    p_next_steps,
    p_notes,
    now()
  )
  ON CONFLICT (subject, concept) DO UPDATE SET
    mastery_level = p_mastery_level,
    overview_gist = p_overview_gist,
    deep_dive_gist = p_deep_dive_gist,
    strong_areas = p_strong_areas,
    weak_areas = p_weak_areas,
    next_steps = p_next_steps,
    notes = p_notes,
    last_updated = now()
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Grant access to anonymous/public role
GRANT EXECUTE ON FUNCTION upsert_concept TO anon;
GRANT EXECUTE ON FUNCTION upsert_concept TO public;
