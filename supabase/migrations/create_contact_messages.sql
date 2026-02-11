-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow inserts from anyone (public form, no auth needed)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public can insert (the form is on the landing page, no auth)
CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read contact messages"
  ON contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update (mark as read)
CREATE POLICY "Authenticated users can update contact messages"
  ON contact_messages FOR UPDATE
  USING (auth.role() = 'authenticated');
