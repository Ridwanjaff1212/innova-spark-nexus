-- Create coding_challenges table with admin management
CREATE TABLE IF NOT EXISTS public.coding_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'medium',
  xp_reward INTEGER DEFAULT 50,
  deadline TIMESTAMP WITH TIME ZONE,
  language TEXT DEFAULT 'any',
  starter_code TEXT,
  solution_hint TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create challenge completions table for XP tracking
CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.coding_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  submission_code TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- Create code review requests table
CREATE TABLE IF NOT EXISTS public.code_review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID NOT NULL REFERENCES public.code_hub_snippets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create review responses table with XP rewards
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.code_review_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  feedback TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  xp_earned INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coding_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Policies for coding_challenges
CREATE POLICY "Anyone can view active challenges" ON public.coding_challenges
FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage challenges" ON public.coding_challenges
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for challenge_completions
CREATE POLICY "Users can view own completions" ON public.challenge_completions
FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can submit completions" ON public.challenge_completions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for code_review_requests
CREATE POLICY "Anyone can view review requests" ON public.code_review_requests
FOR SELECT USING (true);

CREATE POLICY "Users can create review requests" ON public.code_review_requests
FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update own requests" ON public.code_review_requests
FOR UPDATE USING (auth.uid() = requester_id OR has_role(auth.uid(), 'admin'::app_role));

-- Policies for review_responses
CREATE POLICY "Anyone can view responses" ON public.review_responses
FOR SELECT USING (true);

CREATE POLICY "Users can create responses" ON public.review_responses
FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewers can update own responses" ON public.review_responses
FOR UPDATE USING (auth.uid() = reviewer_id);