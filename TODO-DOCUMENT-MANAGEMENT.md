# TODO - Gestion Complète des Documents

## Objectif
Assurer que tous les documents créés sont sauvegardés dans la base de données, stockés sur S3, indexés dans le RAG, et accessibles pour modification/téléchargement.

## Tâches

### 1. Sauvegarde automatique lors de la création
- [ ] Identifier tous les composants de création de documents
- [x] Intégrer l'appel à l'API de sauvegarde (tRPC documents.create)
- [x] Sauvegarder les métadonnées en base de données
- [x] Uploader le fichier sur S3 (via backend)
- [x] Retourner l'ID du document créé

### 2. Indexation RAG automatique
- [x] Appeler l'endpoint RAG après la sauvegarde (dans createWithContent)
- [x] Extraire le texte du document
- [x] Créer les chunks
- [x] Générer les embeddings
- [x] Sauvegarder dans document_chunks

### 3. Interface de liste des documents
- [x] Créer/améliorer le composant DocumentsList (DocumentsListNew)
- [x] Afficher tous les documents de l'utilisateur via tRPC
- [x] Filtres par type, recherche par titre
- [x] Chargement depuis la base de données SQL

### 4. Actions sur les documents
- [x] Bouton "Modifier" → Ouvrir l'éditeur avec le contenu
- [x] Bouton "Télécharger" → Télécharger le fichier Word (avec en-tête Justicia/PORTEO)
- [x] Bouton "Supprimer" → Supprimer de la base et S3 via tRPC
- [ ] Bouton "Partager" → Gérer les permissions (TODO)

### 5. Composants à intégrer
- [x] BlankDocumentEditor (utilise tRPC documents.create)
- [ ] DocumentGenerationForm
- [x] RealtimeVoiceChat (create_blank_document utilise tRPC)
- [ ] CollaborativeEditor
- [ ] DocumentEditor
- [ ] TemplateForm

### 6. Tests
- [ ] Créer un document vierge → Vérifier sauvegarde DB + S3
- [ ] Créer depuis modèle → Vérifier sauvegarde DB + S3
- [ ] Créer par la voix → Vérifier sauvegarde DB + S3
- [ ] Modifier un document → Vérifier mise à jour
- [ ] Télécharger un document → Vérifier format Word
- [ ] Rechercher dans les documents → Vérifier RAG
