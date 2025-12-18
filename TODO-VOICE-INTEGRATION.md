# TODO - Intégration Voix dans Chat et Éditeurs

## Objectif
Intégrer la fonctionnalité Realtime Voice dans le chat et permettre la création/modification de documents par la voix.

## Tâches

### 1. Intégration dans le chat
- [ ] Identifier le composant de chat (ChatInput ou similaire)
- [x] Bouton vagues déjà présent dans ChatInput
- [x] RealtimeVoiceChat réécrit avec OpenAIRealtimeService
- [ ] Gérer la transcription en temps réel dans le chat
- [ ] Envoyer les messages vocaux comme des messages texte

### 2. Création de documents à partir de modèles
- [x] Créer un outil `create_document_from_template`
- [ ] Paramètres : nom du modèle, variables à remplir
- [x] Outils créés et intégrés dans RealtimeVoiceChat
- [ ] Tester la création vocale de documents

### 3. Création de documents vierges
- [x] Créer un outil `create_blank_document`
- [x] Paramètres : titre, type de document, contenu initial
- [x] DocumentVoiceEditor réécrit avec Realtime Voice
- [x] Outils de modification intégrés dans DocumentVoiceEditor

### 4. Modification de documents existants
- [x] DocumentVoiceEditor réécrit avec OpenAIRealtimeService
- [x] Outils update_document_content, insert_text, replace_text, get_document_content
- [x] Intégration dans BlankDocumentEditor
- [ ] Intégrer Realtime Voice dans CollaborativeEditor
- [ ] Intégrer Realtime Voice dans DocumentEditor
- [ ] Intégrer Realtime Voice dans BlankDocumentEditor
- [ ] Tester la modification vocale

### 5. Tests et validation
- [ ] Tester la voix dans le chat
- [ ] Tester la création de documents par modèle
- [ ] Tester la création de documents vierges
- [ ] Tester la modification de documents existants
- [ ] Vérifier la qualité de la voix Coral

### 6. Documentation
- [ ] Documenter l'utilisation de la voix dans le chat
- [ ] Exemples de commandes vocales pour créer des documents
- [ ] Guide utilisateur

## Notes
- Voix : **Coral** (féminine, sérieuse)
- Composants à modifier : ChatInput, CollaborativeEditor, DocumentEditor, BlankDocumentEditor
- Outils existants : update_document_content, insert_text, replace_text, get_document_content
- Nouveaux outils : create_document_from_template, create_blank_document
