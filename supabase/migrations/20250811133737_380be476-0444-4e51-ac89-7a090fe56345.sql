-- Create custom priorities table
CREATE TABLE public.custom_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_priority_per_user UNIQUE (user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.custom_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own priorities" 
ON public.custom_priorities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own priorities" 
ON public.custom_priorities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own priorities" 
ON public.custom_priorities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own priorities" 
ON public.custom_priorities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_priorities_updated_at
BEFORE UPDATE ON public.custom_priorities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default priorities for existing users
INSERT INTO public.custom_priorities (user_id, name, color, sort_order)
SELECT 
  profiles.user_id,
  priority_data.name,
  priority_data.color,
  priority_data.sort_order
FROM public.profiles
CROSS JOIN (
  VALUES 
    ('low', '#10b981', 1),
    ('medium', '#f59e0b', 2), 
    ('high', '#ef4444', 3)
) AS priority_data(name, color, sort_order)
ON CONFLICT (user_id, name) DO NOTHING;