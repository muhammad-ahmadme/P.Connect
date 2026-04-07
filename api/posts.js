const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    const token = req.headers.authorization?.split(' ')[1];
    const { content } = req.body;

    try {
        // 2. SECURITY: Verify the Student/User
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

        // 3. STORAGE PROTECTION: Length & Sanitization
        if (!content || content.length > 500) {
            return res.status(400).json({ error: "Post invalid or too long" });
        }

        // 4. EXECUTION
        const { error } = await supabase.from('world_posts').insert([
            { user_id: user.id, content: content.replace(/</g, "&lt;") }
        ]);

        if (error) throw error;
        return res.status(200).json({ success: true });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
