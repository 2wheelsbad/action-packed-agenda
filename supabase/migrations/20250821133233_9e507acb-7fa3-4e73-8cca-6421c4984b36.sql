-- Add columns for subtask functionality
ALTER TABLE public.todos 
ADD COLUMN parent_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index for better performance on parent_id queries
CREATE INDEX idx_todos_parent_id ON public.todos(parent_id);

-- Create index for sorting within parent groups
CREATE INDEX idx_todos_parent_sort ON public.todos(parent_id, sort_order);