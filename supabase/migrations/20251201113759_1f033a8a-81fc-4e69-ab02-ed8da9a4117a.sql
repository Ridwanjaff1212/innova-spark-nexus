-- Create visitor tracking table for analytics
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_visited TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visitor logs (for tracking)
CREATE POLICY "Anyone can log visits" 
ON public.visitor_logs 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view visitor logs
CREATE POLICY "Admins can view visitor logs" 
ON public.visitor_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_visitor_logs_created_at ON public.visitor_logs(created_at DESC);
CREATE INDEX idx_visitor_logs_visitor_id ON public.visitor_logs(visitor_id);