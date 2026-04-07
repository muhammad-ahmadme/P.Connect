const { createClient } = require('@supabase/supabase-js');

// Initialize with Service Role Key (Stored in Vercel Env Vars)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    // 1. Only allow POST (sending messages)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    const { receiver_id, content } = req.body;

    try {
        // 2. AUTHENTICATION: Is this a valid logged-in user?
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized access" });
        }

        // 3. VALIDATION: Protect the 500MB storage
        // Stop empty messages or massive text dumps
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: "Message cannot be empty" });
        }
        if (content.length > 1000) {
            return res.status(400).json({ error: "Message exceeds 1,000 character limit" });
        }
        if (!receiver_id) {
            return res.status(400).json({ error: "No recipient specified" });
        }

        // 4. SANITIZATION: Prevent XSS attacks in DMs
        const cleanContent = content
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 5. EXECUTION: Insert into the database
        const { error: dbError } = await supabase
            .from('messages')
            .insert([{ 
                sender_id: user.id, 
                receiver_id: receiver_id, 
                content: cleanContent 
            }]);

        if (dbError) throw dbError;

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("DM Error:", err.message);
        return res.status(500).json({ error: "Server error while sending message" });
    }
}
