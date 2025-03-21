/*
  # Create cards table and storage

  1. New Tables
    - `cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `recipient_name` (text)
      - `message` (text)
      - `photo_url` (text)
      - `card_type` (text)
      - `template_id` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `cards` table
    - Add policies for authenticated users to:
      - Create their own cards
      - Read their own cards
*/

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  recipient_name text NOT NULL,
  message text NOT NULL,
  photo_url text,
  card_type text NOT NULL,
  template_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own cards"
  ON cards
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own cards"
  ON cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);