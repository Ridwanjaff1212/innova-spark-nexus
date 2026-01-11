-- Add is_active column to profiles table for account access control
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Allow admins to update any profile (for disabling accounts)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles (already exists but confirm)
-- Note: "Users can view all profiles" policy already exists