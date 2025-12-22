/**
 * Endpoints d'authentification pour Justicia
 * À ajouter dans server.cjs
 */

const crypto = require('crypto');

// Stockage temporaire des tokens de réinitialisation (en production, utiliser Redis ou DB)
const resetTokens = new Map(); // { token: { email, userId, expires } }
const verificationTokens = new Map(); // { token: { email, userId, expires } }

/**
 * Génère un token sécurisé
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/forgot-password
 * Envoie un email de réinitialisation de mot de passe
 */
async function handleForgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email requis' });
        }

        console.log('[Auth] Demande de réinitialisation pour:', email);

        // TODO: Vérifier si l'email existe dans la base de données
        // Pour l'instant, on simule
        const user = {
            id: 'user_' + Date.now(),
            email: email,
            username: email.split('@')[0]
        };

        // Générer un token
        const token = generateToken();
        const expires = Date.now() + (60 * 60 * 1000); // 1 heure

        // Stocker le token
        resetTokens.set(token, {
            email: user.email,
            userId: user.id,
            expires
        });

        // Créer le lien de réinitialisation
        const resetLink = `https://app.justicia.ci/reset-password?token=${token}`;

        // Envoyer l'email (utiliser le service emailService.ts)
        console.log('[Auth] Lien de réinitialisation:', resetLink);
        console.log('[Auth] Token expire à:', new Date(expires).toLocaleString());

        // TODO: Appeler sendPasswordResetEmail()
        // Pour l'instant, on retourne le lien en développement
        res.json({
            success: true,
            message: 'Email de réinitialisation envoyé',
            // En développement seulement :
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        });

    } catch (error) {
        console.error('[Auth] Erreur forgot-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe avec un token
 */
async function handleResetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
        }

        // Vérifier le token
        const tokenData = resetTokens.get(token);

        if (!tokenData) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        if (Date.now() > tokenData.expires) {
            resetTokens.delete(token);
            return res.status(400).json({ error: 'Token expiré' });
        }

        console.log('[Auth] Réinitialisation mot de passe pour:', tokenData.email);

        // TODO: Mettre à jour le mot de passe dans la base de données
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        // await updateUserPassword(tokenData.userId, hashedPassword);

        // Supprimer le token
        resetTokens.delete(token);

        // TODO: Envoyer email de confirmation
        // await sendPasswordChangedEmail({ to: tokenData.email, username: ... });

        res.json({
            success: true,
            message: 'Mot de passe réinitialisé avec succès'
        });

    } catch (error) {
        console.error('[Auth] Erreur reset-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

/**
 * POST /api/auth/change-password
 * Change le mot de passe (utilisateur connecté)
 */
async function handleChangePassword(req, res) {
    try {
        const { userId, oldPassword, newPassword } = req.body;

        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }

        console.log('[Auth] Changement mot de passe pour userId:', userId);

        // TODO: Vérifier l'ancien mot de passe
        // const user = await getUserById(userId);
        // const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        // if (!isValid) {
        //     return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        // }

        // TODO: Mettre à jour le mot de passe
        // const hashedPassword = await bcrypt.hash(newPassword, 10);
        // await updateUserPassword(userId, hashedPassword);

        // TODO: Envoyer email de confirmation
        // await sendPasswordChangedEmail({ to: user.email, username: user.username });

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        console.error('[Auth] Erreur change-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

/**
 * POST /api/auth/send-verification
 * Envoie un email de vérification
 */
async function handleSendVerification(req, res) {
    try {
        const { email, userId, username } = req.body;

        if (!email || !userId) {
            return res.status(400).json({ error: 'Email et userId requis' });
        }

        // Générer un token
        const token = generateToken();
        const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 heures

        // Stocker le token
        verificationTokens.set(token, {
            email,
            userId,
            expires
        });

        // Créer le lien de vérification
        const verificationLink = `https://app.justicia.ci/verify-email?token=${token}`;

        console.log('[Auth] Lien de vérification:', verificationLink);

        // TODO: Envoyer l'email
        // await sendVerificationEmail({ to: email, username, verificationLink });

        res.json({
            success: true,
            message: 'Email de vérification envoyé',
            // En développement seulement :
            verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
        });

    } catch (error) {
        console.error('[Auth] Erreur send-verification:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

/**
 * POST /api/auth/verify-email
 * Vérifie un email avec un token
 */
async function handleVerifyEmail(req, res) {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token requis' });
        }

        // Vérifier le token
        const tokenData = verificationTokens.get(token);

        if (!tokenData) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }

        if (Date.now() > tokenData.expires) {
            verificationTokens.delete(token);
            return res.status(400).json({ error: 'Token expiré' });
        }

        console.log('[Auth] Vérification email pour:', tokenData.email);

        // TODO: Marquer l'email comme vérifié dans la DB
        // await updateUserEmailVerified(tokenData.userId, true);

        // Supprimer le token
        verificationTokens.delete(token);

        res.json({
            success: true,
            message: 'Email vérifié avec succès'
        });

    } catch (error) {
        console.error('[Auth] Erreur verify-email:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}

// Export des handlers
module.exports = {
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword,
    handleSendVerification,
    handleVerifyEmail
};
