-- Add assignment completions tracking table
CREATE TABLE public.assignment_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.assignment_completions ENABLE ROW LEVEL SECURITY;

-- Users can mark their own assignments as complete
CREATE POLICY "Users can complete their assignments" 
ON public.assignment_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their completions
CREATE POLICY "Users can view own completions" 
ON public.assignment_completions 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all completions
CREATE POLICY "Admins can manage completions" 
ON public.assignment_completions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));