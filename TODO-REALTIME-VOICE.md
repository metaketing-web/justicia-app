# TODO - Implémentation Realtime Voice Advanced

## Objectif
Implémenter la conversation vocale en temps réel avec GPT-4o Realtime API pour permettre de parler avec l'IA et modifier les documents directement par la voix.

## Tâches

### 1. Mise à jour du service Realtime
- [x] Installer le nouveau SDK `@openai/agents` (si compatible)
- [x] Créer `realtimeVoiceAdvanced.service.ts` avec la nouvelle API
- [x] Configurer la voix **Coral** (féminine sérieuse)
- [x] Utiliser WebRTC pour le navigateur (via SDK)
- [x] Service mis à jour avec support des outils

### 2. Intégration avec les éditeurs de documents
- [x] Ajouter des outils (function calling) pour modifier les documents
- [x] Outil : `update_document_content` - Modifier le contenu du document
- [x] Outil : `insert_text` - Insérer du texte à une position
- [x] Outil : `get_document_content` - Récupérer le contenu
- [x] Outil : `replace_text` - Remplacer du texte
- [ ] Outil : `format_text` - Appliquer du formatage (optionnel)

### 3. Interface utilisateur
- [x] Créer le composant RealtimeVoiceButtonSimple
- [x] Indicateur visuel de conversation en cours
- [x] Affichage de la transcription en temps réel
- [x] Logs des modifications dans la console

### 4. Composants à mettre à jour
- [ ] CollaborativeEditor - Conversation vocale pendant l'édition
- [ ] DocumentEditor - Modification vocale du document
- [ ] BlankDocumentEditor - Création vocale de contenu
- [ ] ReportGenerator - Génération de rapports par la voix

### 5. Tests
- [ ] Tester la conversation vocale de base
- [ ] Tester la modification de documents par la voix
- [ ] Tester la transcription en temps réel
- [ ] Vérifier la qualité de la voix Coral

### 6. Documentation
- [ ] Documenter l'utilisation de Realtime Voice
- [ ] Exemples de commandes vocales
- [ ] Guide de débogage

## Notes
- Voix choisie : **Coral** (féminine, sérieuse, expressive)
- Modèle : `gpt-realtime` (ou `gpt-realtime-2025-08-28`)
- Méthode de connexion : WebRTC (navigateur)
- SDK : `@openai/agents/realtime` (si compatible avec React)
