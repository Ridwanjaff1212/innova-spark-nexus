-- Code battle rooms
CREATE TABLE public.code_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  problem_statement TEXT NOT NULL,
  starter_code TEXT,
  test_cases JSONB DEFAULT '[]',
  difficulty TEXT DEFAULT 'medium',
  time_limit_seconds INTEGER DEFAULT 900,
  max_participants INTEGER DEFAULT 10,
  status TEXT DEFAULT 'waiting',
  winner_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Battle participants
CREATE TABLE public.battle_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.code_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  status TEXT DEFAULT 'joined',
  score INTEGER DEFAULT 0,
  submission_code TEXT,
  submission_time TIMESTAMP WITH TIME ZONE,
  is_correct BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- Battle leaderboard (all-time stats)
CREATE TABLE public.battle_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  battles_won INTEGER DEFAULT 0,
  battles_played INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_time_seconds NUMERIC DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_leaderboard ENABLE ROW LEVEL SECURITY;

-- Code battles policies
CREATE POLICY "Anyone can view battles" ON public.code_battles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create battles" ON public.code_battles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update own battles" ON public.code_battles FOR UPDATE USING (auth.uid() = created_by);

-- Participants policies  
CREATE POLICY "Anyone can view participants" ON public.battle_participants FOR SELECT USING (true);
CREATE POLICY "Users can join battles" ON public.battle_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.battle_participants FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard policies
CREATE POLICY "Anyone can view leaderboard" ON public.battle_leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can manage own stats" ON public.battle_leaderboard FOR ALL USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_battles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_participants;