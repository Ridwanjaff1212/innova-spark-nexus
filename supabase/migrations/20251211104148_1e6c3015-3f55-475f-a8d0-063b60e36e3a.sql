-- Create pair programming rooms table
CREATE TABLE public.pair_programming_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'javascript',
  code_content TEXT DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 4
);

-- Create room participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.pair_programming_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_host BOOLEAN DEFAULT false,
  cursor_position JSONB DEFAULT '{"line": 0, "column": 0}'::jsonb
);

-- Enable RLS
ALTER TABLE public.pair_programming_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for rooms
CREATE POLICY "Anyone can view active rooms" ON public.pair_programming_rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create rooms" ON public.pair_programming_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Creators can update own rooms" ON public.pair_programming_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete own rooms" ON public.pair_programming_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- RLS policies for participants
CREATE POLICY "Anyone can view participants" ON public.room_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON public.room_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation" ON public.room_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms" ON public.room_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for code sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.pair_programming_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;