-- Activity feed for live updates
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Coding streaks tracking
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_protected_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mystery challenges
CREATE TABLE public.mystery_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  time_limit_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mystery challenge completions
CREATE TABLE public.mystery_challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.mystery_challenges(id),
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  xp_earned INTEGER DEFAULT 0
);

-- User contribution data (for GitHub-style graph)
CREATE TABLE public.user_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contribution_date DATE NOT NULL,
  contribution_count INTEGER DEFAULT 1,
  contribution_type TEXT DEFAULT 'code',
  UNIQUE(user_id, contribution_date)
);

-- AI generated images
CREATE TABLE public.ai_generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mystery_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

-- Activity feed policies
CREATE POLICY "Anyone can view activity feed" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON public.activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view all streaks" ON public.user_streaks FOR SELECT USING (true);
CREATE POLICY "Users can manage own streaks" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);

-- Mystery challenges policies
CREATE POLICY "Anyone can view active challenges" ON public.mystery_challenges FOR SELECT USING (true);
CREATE POLICY "Users can complete challenges" ON public.mystery_challenge_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view completions" ON public.mystery_challenge_completions FOR SELECT USING (true);

-- Contributions policies
CREATE POLICY "Anyone can view contributions" ON public.user_contributions FOR SELECT USING (true);
CREATE POLICY "Users can manage own contributions" ON public.user_contributions FOR ALL USING (auth.uid() = user_id);

-- AI images policies
CREATE POLICY "Users can view own images" ON public.ai_generated_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create images" ON public.ai_generated_images FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;