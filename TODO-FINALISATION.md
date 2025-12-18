# TODO - Finalisation des Fonctionnalités Manquantes

## Fonctionnalités à finaliser (Priorité HAUTE)

### 1. Remplacer DocumentsList par DocumentsListNew dans App.tsx
- [ ] Importer DocumentsListNew dans App.tsx
- [ ] Remplacer toutes les références à DocumentsList
- [ ] Supprimer l'ancien composant DocumentsList.tsx

### 2. Intégrer la génération Word dans tous les composants
- [ ] BlankDocumentEditor - Bouton télécharger direct
- [ ] DocumentGenerationForm - Téléchargement après génération
- [ ] CollaborativeEditor - Bouton télécharger
- [ ] DocumentEditor - Bouton télécharger
- [ ] TemplateForm - Téléchargement du modèle
- [ ] TemplateFormGenerator - Téléchargement du formulaire
- [ ] ReportGenerator - Téléchargement du rapport
- [ ] DocumentHistory - Téléchargement des versions

### 3. Créer un éditeur pour documents existants
- [ ] Créer DocumentEditorFromDB.tsx
- [ ] Charger le contenu depuis la base de données (via tRPC)
- [ ] Permettre la modification
- [ ] Sauvegarder les modifications (update via tRPC)
- [ ] Intégrer dans DocumentsListNew (bouton "Modifier")

### 4. Implémenter l'interface de partage de documents
- [ ] Créer DocumentShareModal.tsx
- [ ] Liste des utilisateurs avec qui partager
- [ ] Sélection des permissions (lecture, écriture, admin)
- [ ] Appeler trpc.permissions.share
- [ ] Intégrer dans DocumentsListNew (bouton "Partager")

### 5. Implémenter create_document_from_template dans RealtimeVoiceChat
- [ ] Créer un endpoint tRPC documents.createFromTemplate
- [ ] Charger le modèle depuis la base
- [ ] Remplir les variables du modèle
- [ ] Sauvegarder le document généré
- [ ] Intégrer dans RealtimeVoiceChat.tsx

## Fonctionnalités à finaliser (Priorité MOYENNE)

### 6. Migration complète vers tRPC
- [ ] Créer router pour l'analyse de documents
- [ ] Créer router pour le chat LLM
- [ ] Créer router pour la génération de contrats
- [ ] Migrer App.tsx vers les nouveaux routers
- [ ] Migrer tous les composants restants

### 7. Rétention automatique des données
- [ ] Créer un script cron pour la suppression automatique
- [ ] Lire le paramètre de rétention depuis user_settings
- [ ] Supprimer les documents expirés (DB + S3)

### 8. Notifications par email réelles
- [ ] Intégrer un service d'email (SendGrid, AWS SES, etc.)
- [ ] Remplacer console.log par l'envoi réel
- [ ] Tester l'envoi d'emails

### 9. Tests unitaires
- [ ] Tests pour documents.createWithContent
- [ ] Tests pour RAG (processDocumentForRAG)
- [ ] Tests pour permissions.share
- [ ] Tests pour notifications.send

## Fonctionnalités à finaliser (Priorité BASSE)

### 10. Optimisation des embeddings
- [ ] Intégrer l'API OpenAI Embeddings
- [ ] Remplacer les pseudo-embeddings dans rag.ts

### 11. Pagination dans DocumentsListNew
- [ ] Ajouter pagination infinie (scroll)
- [ ] Ou pagination par pages (1, 2, 3...)

### 12. Bouton de changement de thème
- [ ] Ajouter un bouton dans l'interface
- [ ] Appeler useSettings().updateSettings({ theme: ... })

## Ordre d'implémentation recommandé

1. **Remplacer DocumentsList** (5 min)
2. **Créer DocumentEditorFromDB** (30 min)
3. **Intégrer génération Word partout** (1h)
4. **Implémenter partage de documents** (45 min)
5. **Implémenter create_document_from_template** (30 min)

**Total estimé : ~3h de travail**


## Statut d'implémentation (EN COURS)

### 1. Remplacer DocumentsList par DocumentsListNew
- [x] TERMINÉ - DocumentHistory remplacé par DocumentsListNew dans App.tsx

### 2. Créer DocumentEditorFromDB
- [x] TERMINÉ - Composant créé et intégré dans App.tsx
- [x] Chargement depuis la base de données via tRPC
- [x] Modification et sauvegarde
- [x] Téléchargement en Word

### 3. Intégrer génération Word partout
- [x] TERMINÉ - Hook useWordDownload créé
- [x] Réutilisable dans tous les composants
- [x] Gestion automatique des en-têtes Justicia/PORTEO

### 4. Interface de partage
- [x] TERMINÉ - DocumentShareModal créé
- [x] Intégré dans DocumentsListNew
- [x] Sélection utilisateur par email
- [x] 3 niveaux de permissions (read/write/admin)

### 5. Création depuis modèles par voix
- [x] TERMINÉ - Endpoint tRPC documents.createFromTemplate créé
- [x] Tests unitaires passants (4/4)
- [x] Intégré dans RealtimeVoiceChat
- [x] Remplacement automatique des variables {{variable}}
