// ========== LOGIN ENDPOINT (HARDCODED) ==========
// Endpoint d'authentification avec credentials hardcodés
// Email: ac@porteo.ai
// Password: 1984

const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('[Login] Tentative de connexion:', { email });

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Authentification hardcodée
        const VALID_EMAIL = 'ac@porteo.ai';
        const VALID_PASSWORD = '1984';

        if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
            console.log('[Login] Identifiants incorrects');
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        // Utilisateur valide
        const user = {
            id: 'user_porteo_001',
            email: 'ac@porteo.ai',
            username: 'Alexandre Cisse',
            role: 'admin',
            emailVerified: true,
            createdAt: Date.now(),
            avatar: null
        };

        console.log('[Login] Connexion réussie:', { userId: user.id, email: user.email });

        res.json({
            success: true,
            user,
            message: 'Connexion réussie'
        });

    } catch (error) {
        console.error('[Login] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur serveur',
            details: error.message 
        });
    }
};

module.exports = { handleLogin };
