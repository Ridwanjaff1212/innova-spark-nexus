-- Seasonal Events table
CREATE TABLE public.seasonal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL DEFAULT 'default',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  badge_reward_id UUID REFERENCES public.badges(id),
  xp_multiplier NUMERIC DEFAULT 1.0,
  special_challenges JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view seasonal events" ON public.seasonal_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seasonal events" ON public.seasonal_events
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Portfolio table
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  theme TEXT DEFAULT 'modern',
  custom_css TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view public portfolios" ON public.portfolios
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolio" ON public.portfolios
  FOR ALL USING (auth.uid() = user_id);

-- WebRTC signaling table for real-time peer connections
CREATE TABLE public.webrtc_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  signal_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webrtc_signals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view signals for them" ON public.webrtc_signals
  FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

CREATE POLICY "Users can create signals" ON public.webrtc_signals
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own signals" ON public.webrtc_signals
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Enable realtime for WebRTC signals
ALTER PUBLICATION supabase_realtime ADD TABLE public.webrtc_signals;