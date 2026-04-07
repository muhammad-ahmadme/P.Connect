const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
    // 1. Only allow POST requests for updates
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    const { bio } = req.body;

    try {
        // 2. IDENTITY CHECK: Verify the JWT from the frontend
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // 3. STORAGE PROTECTION: Enforce strict limits
        // Profiles table should stay small. 160 chars is the industry standard.
        if (bio && bio.length > 160) {
            return res.status(400).json({ error: "Bio is too long (Max 160 characters)" });
        }

        // 4. SANITIZATION: Clean the input
        const cleanBio = bio ? bio.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";

        // 5. EXECUTION: Update only the record belonging to the verified user
        const { error: dbError } = await supabase
            .from('profiles')
            .update({ bio: cleanBio })
            .eq('id', user.id); // Securely locked to the User ID from the token

        if (dbError) throw dbError;

        return res.status(200).json({ success: true, bio: cleanBio });

    } catch (err) {
        console.error("Bio Update Error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
}
