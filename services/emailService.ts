/**
 * Service d'envoi d'emails pour Justicia
 * Utilise l'API Resend pour l'envoi d'emails transactionnels
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

interface PasswordResetEmailOptions {
    to: string;
    username: string;
    resetLink: string;
}

interface PasswordChangedEmailOptions {
    to: string;
    username: string;
}

interface VerifyEmailOptions {
    to: string;
    username: string;
    verificationLink: string;
}

const DEFAULT_FROM = 'Justicia <noreply@justicia.ci>';

/**
 * Envoie un email générique
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    try {
        // Pour l'instant, on utilise l'API Resend
        // En production, remplacer par vos credentials SMTP ou API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.RESEND_API_KEY || 're_demo_key'}`
            },
            body: JSON.stringify({
                from: options.from || DEFAULT_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html
            })
        });

        if (!response.ok) {
            console.error('[EmailService] Erreur envoi email:', await response.text());
            return false;
        }

        console.log('[EmailService] Email envoyé avec succès à:', options.to);
        return true;
    } catch (error) {
        console.error('[EmailService] Erreur:', error);
        return false;
    }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe - Justicia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1f2e; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Justicia</h1>
                            <p style="margin: 10px 0 0 0; color: #e9d5ff; font-size: 14px;">Assistant Juridique IA</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">Réinitialisation de mot de passe</h2>
                            
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Bonjour <strong style="color: #ffffff;">${options.username}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Justicia.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${options.resetLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Réinitialiser mon mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                                Ou copiez ce lien dans votre navigateur :
                            </p>
                            
                            <p style="margin: 0 0 30px 0; padding: 12px; background-color: #0f1419; border-radius: 6px; color: #7c3aed; font-size: 13px; word-break: break-all; font-family: monospace;">
                                ${options.resetLink}
                            </p>
                            
                            <div style="margin: 30px 0 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>⚠️ Important :</strong> Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0f1419; text-align: center; border-top: 1px solid #374151;">
                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                                © 2024 Justicia. Tous droits réservés.
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                <a href="https://justicia.ci" style="color: #7c3aed; text-decoration: none;">justicia.ci</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendEmail({
        to: options.to,
        subject: '🔐 Réinitialisation de votre mot de passe Justicia',
        html
    });
}

/**
 * Envoie un email de confirmation de changement de mot de passe
 */
export async function sendPasswordChangedEmail(options: PasswordChangedEmailOptions): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mot de passe modifié - Justicia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1f2e; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #34d399 100%); padding: 40px 30px; text-align: center;">
                            <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">✅</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Mot de passe modifié</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Bonjour <strong style="color: #ffffff;">${options.username}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Votre mot de passe Justicia a été modifié avec succès.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Date et heure : <strong style="color: #ffffff;">${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}</strong>
                            </p>
                            
                            <div style="margin: 30px 0 0 0; padding: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    <strong>⚠️ Ce n'était pas vous ?</strong><br>
                                    Si vous n'avez pas effectué cette modification, contactez-nous immédiatement à <a href="mailto:support@justicia.ci" style="color: #7c3aed; text-decoration: none;">support@justicia.ci</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0f1419; text-align: center; border-top: 1px solid #374151;">
                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                                © 2024 Justicia. Tous droits réservés.
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                <a href="https://justicia.ci" style="color: #7c3aed; text-decoration: none;">justicia.ci</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendEmail({
        to: options.to,
        subject: '✅ Votre mot de passe Justicia a été modifié',
        html
    });
}

/**
 * Envoie un email de vérification de compte
 */
export async function sendVerificationEmail(options: VerifyEmailOptions): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérifiez votre email - Justicia</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1f2e; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenue sur Justicia !</h1>
                            <p style="margin: 10px 0 0 0; color: #e9d5ff; font-size: 14px;">Assistant Juridique IA</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; font-weight: 600;">Vérifiez votre adresse email</h2>
                            
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Bonjour <strong style="color: #ffffff;">${options.username}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Merci de vous être inscrit sur Justicia ! Pour activer votre compte, veuillez vérifier votre adresse email.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                                Cliquez sur le bouton ci-dessous pour confirmer votre email :
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${options.verificationLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Vérifier mon email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 20px 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                                Ou copiez ce lien dans votre navigateur :
                            </p>
                            
                            <p style="margin: 0 0 30px 0; padding: 12px; background-color: #0f1419; border-radius: 6px; color: #7c3aed; font-size: 13px; word-break: break-all; font-family: monospace;">
                                ${options.verificationLink}
                            </p>
                            
                            <div style="margin: 30px 0 0 0; padding: 20px; background-color: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 6px;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    <strong>ℹ️ Bon à savoir :</strong> Ce lien expire dans <strong>24 heures</strong>.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #0f1419; text-align: center; border-top: 1px solid #374151;">
                            <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                                © 2024 Justicia. Tous droits réservés.
                            </p>
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                                <a href="https://justicia.ci" style="color: #7c3aed; text-decoration: none;">justicia.ci</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return sendEmail({
        to: options.to,
        subject: '📧 Vérifiez votre email - Justicia',
        html
    });
}
