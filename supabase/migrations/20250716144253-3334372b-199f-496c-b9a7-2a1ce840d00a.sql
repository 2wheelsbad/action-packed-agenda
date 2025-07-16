-- Create todos table
CREATE TABLE public.todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create time_logs table  
CREATE TABLE public.time_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  duration INTEGER NOT NULL, -- duration in minutes
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar_events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder' CHECK (type IN ('meeting', 'deadline', 'reminder')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for todos
CREATE POLICY "Users can view their own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for time_logs
CREATE POLICY "Users can view their own time logs" ON public.time_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own time logs" ON public.time_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own time logs" ON public.time_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own time logs" ON public.time_logs FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own calendar events" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own calendar events" ON public.calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own calendar events" ON public.calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for notes
CREATE POLICY "Users can view their own notes" ON public.notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON public.time_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_completed ON public.todos(completed);
CREATE INDEX idx_time_logs_user_id ON public.time_logs(user_id);
CREATE INDEX idx_time_logs_date ON public.time_logs(date);
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_tags ON public.notes USING GIN(tags);