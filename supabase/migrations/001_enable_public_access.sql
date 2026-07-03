-- Allow public (anonymous) users to insert and update concepts
-- This is safe for a development/study app where anyone can save their concepts

-- First, ensure RLS is enabled on the concepts table
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public insert" ON concepts
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON concepts
FOR UPDATE WITH CHECK (true);

CREATE POLICY "Allow public select" ON concepts
FOR SELECT USING (true);

CREATE POLICY "Allow public delete" ON concepts
FOR DELETE USING (true);
