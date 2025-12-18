# Services Justicia - Documentation

## Services implémentés

### 1. Gestion des Paramètres (`hooks/useSettings.ts`)

Hook React pour gérer tous les paramètres de l'application avec persistance backend.

**Utilisation :**
```typescript
import { useSettings } from './hooks/useSettings';

function MyComponent() {
    const { settings, updateSettings, isLoading } = useSettings();
    
    // Changer le thème
    await updateSettings({ theme: 'dark' });
    
    // Changer la langue
    await updateSettings({ language: 'en' });
}
```

**Paramètres disponibles :**
- `language`: 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt'
- `theme`: 'light' | 'dark' | 'system'
- `receiveExclusiveContent`: boolean
- `emailOnTaskStart`: boolean
- `autoSaveDocuments`: boolean
- `showAnalysisSummary`: boolean
- `enableVoiceChat`: boolean
- `dataRetention`: number (jours)

### 2. Internationalisation (`services/i18n.ts`)

Système de traduction pour 6 langues.

**Utilisation :**
```typescript
import { useTranslation } from './services/i18n';

function MyComponent() {
    const { t, language, changeLanguage } = useTranslation();
    
    return (
        <div>
            <h1>{t('common.welcome')}</h1>
            <button onClick={() => changeLanguage('en')}>
                English
            </button>
        </div>
    );
}
```

**Langues supportées :**
- Français (fr)
- English (en)
- Español (es)
- Deutsch (de)
- Italiano (it)
- Português (pt)

**Clés de traduction disponibles :**
- `common.*` - Mots communs (save, cancel, delete, etc.)
- `chat.*` - Interface de chat
- `documents.*` - Gestion des documents
- `settings.*` - Page de paramètres
- `assistant.*` - Messages de l'assistant
- `errors.*` - Messages d'erreur

### 3. Auto-Save (`services/autoSaveService.ts`)

Service de sauvegarde automatique des documents toutes les 30 secondes.

**Utilisation :**
```typescript
import { useAutoSave } from './services/autoSaveService';

function DocumentEditor() {
    const [content, setContent] = useState('');
    
    const { isSaving, lastSaved, saveNow } = useAutoSave(
        'document-id',
        content,
        async (content) => {
            // Sauvegarder dans le backend
            await api.documents.save(content);
        },
        true // enabled
    );
    
    return (
        <div>
            <textarea value={content} onChange={e => setContent(e.target.value)} />
            {isSaving && <span>Sauvegarde en cours...</span>}
            {lastSaved && <span>Dernière sauvegarde: {lastSaved.toLocaleTimeString()}</span>}
            <button onClick={saveNow}>Sauvegarder maintenant</button>
        </div>
    );
}
```

**Fonctionnalités :**
- Sauvegarde automatique toutes les 30 secondes
- Indicateur visuel de sauvegarde
- Sauvegarde manuelle à la demande
- Gestion des erreurs

### 4. Notifications (`services/notificationService.ts`)

Service de notifications push navigateur et toast dans l'interface.

**Utilisation :**
```typescript
import { useNotifications } from './services/notificationService';

function MyComponent() {
    const { hasPermission, requestPermission, success, error, info } = useNotifications();
    
    // Demander la permission
    await requestPermission();
    
    // Afficher des notifications
    success('Succès', 'Document sauvegardé');
    error('Erreur', 'Échec de la sauvegarde');
    info('Information', 'Analyse en cours');
}
```

**Types de notifications :**
- `success` - Notification de succès (vert)
- `error` - Notification d'erreur (rouge)
- `warning` - Notification d'avertissement (jaune)
- `info` - Notification d'information (bleu)

**Notifications prédéfinies :**
- `analysisStarted(documentName)` - Analyse démarrée
- `analysisCompleted(documentName)` - Analyse terminée
- `analysisError(documentName, error)` - Erreur d'analyse
- `autoSaved()` - Sauvegarde automatique

### 5. Thèmes (`theme.css`)

Variables CSS pour les thèmes clair et sombre.

**Variables disponibles :**
```css
--bg-primary
--bg-secondary
--bg-tertiary
--text-primary
--text-secondary
--text-tertiary
--border-color
--accent-color
--accent-hover
--success-color
--error-color
--warning-color
```

**Utilisation :**
```css
.my-component {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--border-color);
}
```

## Endpoints Backend (tRPC)

### Notifications

**`notifications.sendEmail`**
```typescript
await trpc.notifications.sendEmail.mutate({
    subject: 'Analyse terminée',
    body: 'Votre document a été analysé avec succès.',
    type: 'analysisComplete'
});
```

**`notifications.sendPush`**
```typescript
await trpc.notifications.sendPush.mutate({
    title: 'Nouveau document',
    body: 'Un document a été partagé avec vous.',
    type: 'info'
});
```

**`notifications.getHistory`**
```typescript
const history = await trpc.notifications.getHistory.query({
    limit: 20,
    offset: 0
});
```

## Intégration dans App.tsx

Pour activer tous les services dans l'application principale :

```typescript
import { useSettings } from './hooks/useSettings';
import { useTranslation } from './services/i18n';
import { useNotifications } from './services/notificationService';
import './theme.css';

function App() {
    const { settings, updateSettings } = useSettings();
    const { t, changeLanguage } = useTranslation();
    const { requestPermission } = useNotifications();
    
    useEffect(() => {
        // Appliquer la langue des paramètres
        changeLanguage(settings.language);
        
        // Demander la permission pour les notifications
        if (settings.emailOnTaskStart) {
            requestPermission();
        }
    }, [settings]);
    
    return (
        <div>
            {/* Votre application */}
        </div>
    );
}
```

## Tests

Pour tester les services :

1. **Thèmes** : Changer le thème dans les paramètres et vérifier que l'interface change de couleur
2. **Langue** : Changer la langue et vérifier que tous les textes sont traduits
3. **Auto-save** : Modifier un document et attendre 30 secondes pour voir l'indicateur de sauvegarde
4. **Notifications** : Déclencher une action et vérifier qu'une notification apparaît

## TODO

- [ ] Connecter useSettings au backend tRPC (actuellement localStorage seulement)
- [ ] Implémenter l'envoi d'emails réel (SendGrid, AWS SES, etc.)
- [ ] Implémenter la rétention automatique des données (tâche cron)
- [ ] Ajouter plus de traductions pour couvrir toute l'interface
- [ ] Ajouter des tests unitaires pour tous les services
