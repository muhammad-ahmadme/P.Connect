const { createClient } = require('@supabase/supabase-js');

// Database Credentials
const supabaseUrl = 'https://aelkiokxzzfnfvermrjy.supabase.co';
const supabaseKey = 'sb_publishable_r8ncudJ8R49sXNlsE3OKvA_D4Ak_CHC';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // 1. Only allow POST requests for sending messages
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

  // 3. Extract Message Data
  const { receiver_id, content } = req.body;

  if (!receiver_id || !content) {
    return res.status(400).json({ error: 'Missing receiver_id or message content' });
  }

  // 4. Insert into Database
  const { data, error } = await supabase
    .from('messages')
    .insert([
      { 
        sender_id: user.id, 
        receiver_id: receiver_id, 
        content: content 
      }
    ])
    .select()
    .maybeSingle();

  // 5. Handle Errors
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // 6. Return Success
  return res.status(200).json(data);
};
