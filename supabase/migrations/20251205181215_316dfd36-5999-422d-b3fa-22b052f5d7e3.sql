-- Create code_hub_snippets table for storing code snippets
CREATE TABLE public.code_hub_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create code_reviews table for peer reviews
CREATE TABLE public.code_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snippet_id UUID NOT NULL REFERENCES public.code_hub_snippets(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_hub_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for code_hub_snippets
CREATE POLICY "Anyone can view snippets" ON public.code_hub_snippets FOR SELECT USING (true);
CREATE POLICY "Users can create snippets" ON public.code_hub_snippets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snippets" ON public.code_hub_snippets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own snippets or admins" ON public.code_hub_snippets FOR DELETE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for code_reviews
CREATE POLICY "Anyone can view reviews" ON public.code_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.code_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update own reviews" ON public.code_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete own reviews" ON public.code_reviews FOR DELETE USING (auth.uid() = reviewer_id);