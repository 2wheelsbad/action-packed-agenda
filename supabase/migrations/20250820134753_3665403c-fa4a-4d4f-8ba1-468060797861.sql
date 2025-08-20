-- Remove the last policy that still exposes all data
DROP POLICY IF EXISTS "Users can view basic profile info of others" ON public.profiles;

-- Create a view that only exposes safe profile data (no emails)
CREATE VIEW public.safe_profiles AS 
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.safe_profiles SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;