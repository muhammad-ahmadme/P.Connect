const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aelkiokxzzfnfvermrjy.supabase.co';
const supabaseKey = 'sb_publishable_r8ncudJ8R49sXNlsE3OKvA_D4Ak_CHC';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { receiver_id, content } = req.body;
  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id: user.id, receiver_id, content }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data);
};
