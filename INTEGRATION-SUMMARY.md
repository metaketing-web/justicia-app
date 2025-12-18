# Résumé de l'intégration des paramètres Justicia

## Modifications apportées

### 1. App.tsx

**Imports ajoutés :**
```typescript
import { useSettings } from './hooks/useSettings';
import { useTranslation, i18n } from './services/i18n';
import { useNotifications } from './services/notificationService';
import './theme.css';
```

**Hooks intégrés :**
```typescript
const { settings: appSettings, updateSettings, isLoading: settingsLoading } = useSettings();
const { t, changeLanguage } = useTranslation();
const { hasPermission, requestPermission, success: notifySuccess, error: notifyError } = useNotifications();
```

**useEffect ajouté :**
- Initialisation de la langue au démarrage
- Demande de permission pour les notifications si activé

**Mise à jour de AppSettingsComponent :**
- Utilise maintenant `updateSettings()` au lieu de `setAppSettings()`
- Applique automatiquement la langue quand elle change
- Affiche une notification de succès après la sauvegarde

### 2. Nouveaux services créés

#### `hooks/useSettings.ts`
- Hook React pour gérer tous les paramètres
- Applique automatiquement le thème et la langue
- Sauvegarde dans localStorage (TODO: backend)

#### `services/i18n.ts`
- Système de traduction pour 6 langues
- Hook `useTranslation()` pour utiliser dans les composants
- Traductions complètes pour toutes les sections

#### `services/autoSaveService.ts`
- Service de sauvegarde automatique toutes les 30 secondes
- Hook `useAutoSave()` pour utiliser dans les éditeurs
- Indicateurs visuels de sauvegarde

#### `services/notificationService.ts`
- Notifications push navigateur
- Notifications toast dans l'interface
- Hook `useNotifications()` pour utiliser dans les composants

#### `theme.css`
- Variables CSS pour les thèmes
- Support des modes clair, sombre et système
- Transitions douces entre les thèmes

### 3. Backend (tRPC)

#### `server/routers/notifications.ts`
- Endpoint `sendEmail` pour envoyer des emails
- Endpoint `sendPush` pour les notifications push
- Endpoint `getHistory` pour l'historique des notifications
- Endpoint `markAsRead` et `delete` pour la gestion

#### `server/routers.ts`
- Ajout du router `notifications`

## État actuel

### ✅ Fonctionnel
- Changement de thème (clair/sombre/système)
- Changement de langue (6 langues)
- Notifications toast dans l'interface
- Sauvegarde automatique (service prêt)
- Tous les paramètres sont sauvegardés dans localStorage

### ⚠️ Partiellement fonctionnel
- Notifications push (nécessite permission utilisateur)
- Envoi d'emails (logs console seulement, pas d'envoi réel)

### ❌ Non implémenté
- Synchronisation avec le backend tRPC (les paramètres sont en localStorage uniquement)
- Rétention automatique des données (pas de tâche cron)
- Traduction complète de toute l'interface (seulement les sections principales)

## Prochaines étapes

### 1. Connecter au backend tRPC
```typescript
// Dans hooks/useSettings.ts
const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setIsLoading(true);
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('justiciaAppSettings', JSON.stringify(updated));
    
    // Ajouter ceci :
    try {
        await trpc.settings.update.mutate(updated);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
    
    setIsLoading(false);
};
```

### 2. Implémenter l'envoi d'emails
```typescript
// Dans server/routers/notifications.ts
// Utiliser SendGrid, AWS SES, ou un autre service
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
    to: user.email,
    from: 'noreply@justicia.ci',
    subject: input.subject,
    text: input.body,
};

await sgMail.send(msg);
```

### 3. Implémenter la rétention des données
```typescript
// Créer une tâche cron dans le backend
import cron from 'node-cron';

// Exécuter tous les jours à minuit
cron.schedule('0 0 * * *', async () => {
    const users = await db.select().from(users);
    
    for (const user of users) {
        const settings = await db.getUserSettings(user.id);
        if (settings.dataRetention > 0) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() - settings.dataRetention);
            
            // Supprimer les documents expirés
            await db.deleteExpiredDocuments(user.id, expiryDate);
        }
    }
});
```

### 4. Traduire toute l'interface
- Identifier tous les textes en dur dans les composants
- Remplacer par des appels à `t()`
- Ajouter les traductions dans `services/i18n.ts`

## Tests recommandés

Voir `TEST-SETTINGS.md` pour la liste complète des tests à effectuer.

## Documentation

Voir `SERVICES-README.md` pour la documentation complète des services.
