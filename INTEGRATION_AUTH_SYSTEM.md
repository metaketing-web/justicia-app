# 🔐 Guide d'Intégration du Système d'Authentification

Ce guide explique comment intégrer le système complet d'authentification avec envoi d'emails dans l'application Justicia.

---

## 📦 Fichiers Créés

### Services
- `services/emailService.ts` - Service d'envoi d'emails (Resend API)

### Backend
- `auth-endpoints.cjs` - Endpoints d'authentification (à intégrer dans server.cjs)

### Frontend
- `components/ForgotPasswordModal.tsx` - Modal "Mot de passe oublié"
- `components/ResetPasswordPage.tsx` - Page de réinitialisation
- `components/VerifyEmailPage.tsx` - Page de vérification email
- `components/ChangePasswordModal.tsx` - Modal changement mot de passe (déjà intégré)

---

## 🔧 Étape 1 : Intégrer les Endpoints Backend

### 1.1 Ajouter les endpoints dans `server.cjs`

Ajoutez ces lignes **avant** `app.listen()` :

```javascript
// ========== AUTH ENDPOINTS ==========
const {
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword,
    handleSendVerification,
    handleVerifyEmail
} = require('./auth-endpoints.cjs');

app.post('/api/auth/forgot-password', handleForgotPassword);
app.post('/api/auth/reset-password', handleResetPassword);
app.post('/api/auth/change-password', handleChangePassword);
app.post('/api/auth/send-verification', handleSendVerification);
app.post('/api/auth/verify-email', handleVerifyEmail);
// ========== END AUTH ENDPOINTS ==========
```

### 1.2 Configurer la clé API Resend

Ajoutez dans votre fichier `.env` :

```bash
RESEND_API_KEY=re_votre_cle_api
NODE_ENV=production
```

Pour obtenir une clé API Resend :
1. Créez un compte sur https://resend.com
2. Vérifiez votre domaine (justicia.ci)
3. Générez une clé API

---

## 🎨 Étape 2 : Intégrer les Composants Frontend

### 2.1 Ajouter les routes dans `App.tsx`

Ajoutez ces imports :

```typescript
import ResetPasswordPage from './components/ResetPasswordPage';
import VerifyEmailPage from './components/VerifyEmailPage';
import ForgotPasswordModal from './components/ForgotPasswordModal';
```

Ajoutez ces routes dans le composant `App` :

```typescript
<Route path="/reset-password" component={ResetPasswordPage} />
<Route path="/verify-email" component={VerifyEmailPage} />
```

### 2.2 Ajouter le bouton "Mot de passe oublié"

Dans votre page de connexion, ajoutez :

```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false);

// Dans le JSX :
<button
    onClick={() => setShowForgotPassword(true)}
    className="text-sm text-purple-400 hover:text-purple-300"
>
    Mot de passe oublié ?
</button>

{showForgotPassword && (
    <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
)}
```

---

## 📧 Étape 3 : Connecter le Service d'Emails

### 3.1 Modifier `auth-endpoints.cjs`

Ajoutez l'import du service d'emails :

```javascript
// En haut du fichier
const { 
    sendPasswordResetEmail, 
    sendPasswordChangedEmail,
    sendVerificationEmail 
} = require('./services/emailService');
```

### 3.2 Décommenter les appels d'emails

Dans `handleForgotPassword` :

```javascript
// Remplacer le TODO par :
await sendPasswordResetEmail({
    to: user.email,
    username: user.username,
    resetLink
});
```

Dans `handleResetPassword` :

```javascript
// Remplacer le TODO par :
await sendPasswordChangedEmail({
    to: tokenData.email,
    username: user.username
});
```

Dans `handleChangePassword` :

```javascript
// Remplacer le TODO par :
await sendPasswordChangedEmail({
    to: user.email,
    username: user.username
});
```

Dans `handleSendVerification` :

```javascript
// Remplacer le TODO par :
await sendVerificationEmail({
    to: email,
    username,
    verificationLink
});
```

---

## 🗄️ Étape 4 : Intégrer avec la Base de Données

### 4.1 Ajouter les champs nécessaires

Ajoutez ces champs à votre table `users` :

```sql
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires BIGINT;
```

### 4.2 Implémenter les fonctions de base de données

Dans `auth-endpoints.cjs`, remplacez les TODO par de vraies requêtes :

```javascript
// Exemple avec MySQL
const mysql = require('mysql2/promise');

async function getUserByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

async function updateUserPassword(userId, passwordHash) {
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

async function updateUserEmailVerified(userId, verified) {
    await db.query('UPDATE users SET email_verified = ? WHERE id = ?', [verified, userId]);
}
```

### 4.3 Ajouter le hachage de mot de passe

Installez bcrypt :

```bash
npm install bcrypt
```

Utilisez-le dans les endpoints :

```javascript
const bcrypt = require('bcrypt');

// Hacher un mot de passe
const hashedPassword = await bcrypt.hash(newPassword, 10);

// Vérifier un mot de passe
const isValid = await bcrypt.compare(oldPassword, user.password_hash);
```

---

## ✅ Étape 5 : Tests

### 5.1 Tester "Mot de passe oublié"

1. Cliquez sur "Mot de passe oublié"
2. Saisissez votre email
3. Vérifiez la réception de l'email
4. Cliquez sur le lien
5. Saisissez un nouveau mot de passe
6. Vérifiez la réception de l'email de confirmation

### 5.2 Tester "Changement de mot de passe"

1. Connectez-vous
2. Allez dans Compte → Mot de passe
3. Saisissez l'ancien et le nouveau mot de passe
4. Vérifiez la réception de l'email de confirmation

### 5.3 Tester "Vérification d'email"

1. Créez un nouveau compte
2. Vérifiez la réception de l'email de vérification
3. Cliquez sur le lien
4. Vérifiez que le compte est activé

---

## 🔒 Sécurité

### Recommandations

1. **HTTPS obligatoire** en production
2. **Rate limiting** sur les endpoints d'auth (max 5 tentatives/heure)
3. **Tokens expirables** (1h pour reset, 24h pour verification)
4. **Hachage bcrypt** avec salt rounds ≥ 10
5. **Validation email** côté serveur
6. **Logs d'audit** pour toutes les opérations sensibles

### Exemple de rate limiting

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5, // 5 requêtes max
    message: 'Trop de tentatives, réessayez dans 1 heure'
});

app.post('/api/auth/forgot-password', authLimiter, handleForgotPassword);
app.post('/api/auth/reset-password', authLimiter, handleResetPassword);
```

---

## 📝 Templates d'Emails

Les templates d'emails sont déjà créés dans `services/emailService.ts` :

- **Réinitialisation** : Design violet avec bouton CTA
- **Confirmation** : Design vert avec icône de succès
- **Vérification** : Design violet avec message de bienvenue

Tous les templates sont responsive et incluent :
- Logo Justicia
- Couleurs de marque (violet #7c3aed)
- Boutons CTA
- Liens de secours
- Footer avec copyright

---

## 🚀 Déploiement

### Checklist avant déploiement

- [ ] Clé API Resend configurée
- [ ] Domaine vérifié sur Resend
- [ ] Base de données mise à jour
- [ ] HTTPS activé
- [ ] Rate limiting configuré
- [ ] Logs d'audit activés
- [ ] Tests complets effectués
- [ ] Variables d'environnement en production

---

## 📊 Monitoring

### Métriques à surveiller

- Nombre d'emails envoyés/jour
- Taux de délivrabilité
- Temps de réponse des endpoints
- Nombre de tentatives échouées
- Tokens expirés

### Logs recommandés

```javascript
console.log('[Auth] Forgot password requested:', { email, timestamp });
console.log('[Auth] Password reset successful:', { userId, timestamp });
console.log('[Auth] Email verified:', { userId, timestamp });
console.log('[Auth] Password changed:', { userId, timestamp });
```

---

## 🆘 Support

En cas de problème :

1. Vérifiez les logs serveur
2. Vérifiez les logs Resend
3. Testez l'endpoint avec Postman
4. Vérifiez la configuration DNS du domaine

---

**Système d'authentification prêt à l'emploi ! 🎉**
