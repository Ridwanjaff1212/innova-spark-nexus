-- Create assignments table for admin to assign tasks to students
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'task',
  priority TEXT DEFAULT 'normal',
  deadline TIMESTAMP WITH TIME ZONE,
  assigned_to UUID[] DEFAULT '{}',
  assigned_to_all BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Admins can manage assignments
CREATE POLICY "Admins can manage assignments" 
ON public.assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view assignments assigned to them or all
CREATE POLICY "Users can view their assignments" 
ON public.assignments 
FOR SELECT 
USING (assigned_to_all = true OR auth.uid() = ANY(assigned_to) OR has_role(auth.uid(), 'admin'::app_role));