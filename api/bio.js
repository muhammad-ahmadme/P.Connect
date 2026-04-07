const { createClient } = require('@supabase/supabase-js');

// Database Credentials
const supabaseUrl = 'https://aelkiokxzzfnfvermrjy.supabase.co';
const supabaseKey = 'sb_publishable_r8ncudJ8R49sXNlsE3OKvA_D4Ak_CHC';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Validate User Token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  // 3. Update the Bio
  const { bio } = req.body;
  
  // We use .maybeSingle() to prevent the "coerce to single JSON object" crash
  const { data, error } = await supabase
    .from('profiles')
    .update({ bio: bio })
    .eq('id', user.id)
    .select()
    .maybeSingle();

  // 4. Handle Potential Database Errors
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 5. Check if the profile actually existed
  if (!data) {
    return res.status(404).json({ 
      error: "Profile not found. Make sure your 'profiles' table has a row with your User ID." 
    });
  }

  // 6. Return the updated bio
  return res.status(200).json(data);
};
