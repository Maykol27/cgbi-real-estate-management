-- Drop redundant policy that caused infinite recursion with is_admin() function
drop policy "Admins/Collaborators can view all profiles" on profiles;
