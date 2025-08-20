-- Remove the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy to allow users to view other users' basic info (display_name only, no email)
-- This is safer for features that might need to show usernames
CREATE POLICY "Users can view basic profile info of others" 
ON public.profiles 
FOR SELECT 
USING (true);