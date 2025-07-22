-- Add completed_at column to todos table to track when tasks were completed
ALTER TABLE public.todos 
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE NULL;