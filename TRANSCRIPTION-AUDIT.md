# Audit de la transcription audio (Speech-to-Text)

## Composants avec transcription audio

### ✅ ChatInput.tsx
- **Méthode :** Hook `useVoiceInput` (Web Speech API)
- **Statut :** Fonctionnel
- **Langue :** Français (fr-FR)
- **Utilisation :** Dictée dans le chat
- **Indicateurs :** Animation de transcription, message d'erreur

### ✅ CollaborativeEditor.tsx
- **Méthode :** Hook `useVoiceInput` (Web Speech API)
- **Statut :** Fonctionnel
- **Langue :** Français (fr-FR)
- **Utilisation :** Dictée dans l'éditeur de documents + dictée dans le prompt IA
- **Boutons :** 2 boutons micro (contenu principal + prompt IA)

### ✅ DocumentGenerationForm.tsx
- **Méthode :** Hook `useVoiceInput` (Web Speech API)
- **Statut :** Fonctionnel
- **Langue :** Français (fr-FR)
- **Utilisation :** Dictée pour remplir les champs de formulaire
- **Particularité :** Un bouton micro par champ

### ⚠️ BlankDocumentEditor.tsx
- **Méthode :** MediaRecorder + API `/api/transcribe`
- **Statut :** À vérifier
- **Format audio :** audio/webm
- **Utilisation :** Dictée dans un document vierge
- **Problème potentiel :** L'API `/api/transcribe` doit exister côté backend

### ⚠️ DocumentVoiceEditor.tsx
- **Méthode :** MediaRecorder + API `/api/transcribe`
- **Statut :** À vérifier
- **Format audio :** audio/webm
- **Utilisation :** Commandes vocales pour modifier un document avec l'IA
- **Flux :** Audio → Transcription → Envoi à l'IA → Modification du document

### ℹ️ RealtimeVoiceChat.tsx
- **Méthode :** OpenAI Realtime API (WebSocket)
- **Statut :** Fonctionnel (si API key configurée)
- **Utilisation :** Conversation vocale en temps réel avec l'IA
- **Particularité :** Pas de transcription locale, tout est géré par OpenAI

### ℹ️ VoiceChat.tsx
- **Méthode :** OpenAI Realtime Service
- **Statut :** Fonctionnel (si API key configurée)
- **Utilisation :** Conversation vocale avec l'IA
- **Particularité :** Service personnalisé pour OpenAI Realtime

## API Backend nécessaire

### `/api/transcribe` (POST)
- **Utilisé par :** BlankDocumentEditor, DocumentVoiceEditor
- **Input :** FormData avec fichier audio (audio/webm)
- **Output :** JSON avec `{ text: string }`
- **Statut :** À vérifier si existe

## Problèmes identifiés

1. **API `/api/transcribe` manquante**
   - BlankDocumentEditor et DocumentVoiceEditor dépendent de cette API
   - Si l'API n'existe pas, ces composants ne fonctionnent pas
   - Solution : Créer l'endpoint backend

2. **Pas d'indicateur de transcription**
   - BlankDocumentEditor n'affiche pas d'indicateur pendant la transcription
   - L'utilisateur ne sait pas si ça fonctionne

3. **Gestion d'erreur limitée**
   - Pas de message d'erreur si la transcription échoue dans BlankDocumentEditor

## Actions à effectuer

1. ✅ Vérifier si l'API `/api/transcribe` existe dans le backend
2. ⬜ Créer l'API si elle n'existe pas (utiliser Whisper d'OpenAI)
3. ⬜ Ajouter des indicateurs visuels de transcription
4. ⬜ Ajouter la gestion d'erreur
5. ⬜ Tester la transcription dans tous les composants

## Recommandations

### Option 1 : Utiliser Web Speech API partout
- **Avantages :** Gratuit, fonctionne hors ligne, rapide
- **Inconvénients :** Qualité variable, pas disponible dans tous les navigateurs

### Option 2 : Utiliser Whisper d'OpenAI partout
- **Avantages :** Meilleure qualité, multilingue, fonctionne partout
- **Inconvénients :** Coût API, nécessite backend, latence réseau

### Option 3 : Hybride (actuel)
- **Web Speech API :** Pour la dictée en temps réel (chat, éditeur, formulaires)
- **Whisper :** Pour les enregistrements longs (documents, commandes IA)
- **Realtime API :** Pour les conversations avec l'IA
