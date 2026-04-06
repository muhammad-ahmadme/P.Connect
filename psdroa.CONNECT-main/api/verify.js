import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, username, password } = req.body;

  // IMPROVED REGEX: 
  // 1. Case-insensitive (i flag)
  // 2. Starts with aps
  // 3. Allows dots, numbers, or letters immediately after
  const isStudent = /^aps[a-z0-9._%+-]*@amitysharjah\.ae$/i.test(email);

  if (!isStudent) {
    console.log("Rejected Email:", email); // This shows up in your Vercel logs
    return res.status(403).json({ error: "Access Denied. Use school email." });
  }

  const { data, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  if (data.user) {
    await supabase.from('profiles').upsert([
      { id: data.user.id, username, email, is_verified: false }
    ]);
  }

  return res.status(200).json({ message: "In the waiting line." });
}
