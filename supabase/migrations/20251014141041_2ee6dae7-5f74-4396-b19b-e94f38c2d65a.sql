-- Add questions column to notes table
ALTER TABLE public.notes 
ADD COLUMN questions jsonb DEFAULT NULL;