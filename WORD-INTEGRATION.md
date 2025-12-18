# Intégration de la génération de documents Word

## Service créé

**Fichier :** `services/wordDocumentService.ts`

Ce service utilise la bibliothèque `docx` pour générer des documents Word (.docx) avec les en-têtes appropriés :
- **Justicia** : Pour les analyses et synthèses de chat
- **PORTEO** : Pour les modèles et documents vierges

### Fonctions disponibles

```typescript
// Génération générique
generateWordDocument(options: WordDocumentOptions): Promise<void>

// Analyses Justicia
generateAnalysisDocument(title: string, content: string, filename?: string): Promise<void>

// Synthèses de chat Justicia
generateChatSummaryDocument(title: string, content: string, filename?: string): Promise<void>

// Modèles PORTEO
generateTemplateDocument(title: string, content: string, filename?: string): Promise<void>

// Documents vierges PORTEO
generateBlankDocument(title: string, content: string, filename?: string): Promise<void>
```

## Composants intégrés

### ✅ AnalysisResultsView.tsx
- **Fonction modifiée :** `handleDownloadDOCX`
- **En-tête :** Justicia
- **Utilisation :** `generateAnalysisDocument()`
- **Contenu :** Analyse complète avec résumé, risques, insights IA

### ✅ ChatMessage.tsx
- **Fonction modifiée :** `handleDownloadWord`
- **En-tête :** Justicia
- **Utilisation :** `generateChatSummaryDocument()`
- **Contenu :** Synthèse de conversation

## Composants à intégrer

### 🔄 BlankDocumentEditor.tsx
- **Fonction à modifier :** `handleGenerate`
- **En-tête :** PORTEO
- **Utilisation :** `generateBlankDocument()`
- **Action :** Remplacer l'appel à `onGenerate` par le service Word

### 🔄 DocumentGenerationForm.tsx
- **Fonction à modifier :** `handleSubmit` → `onGenerate`
- **En-tête :** PORTEO
- **Utilisation :** `generateTemplateDocument()`
- **Action :** Modifier la fonction `onGenerate` dans le composant parent (App.tsx)

### 🔄 CollaborativeEditor.tsx
- **Fonction à modifier :** `handleDownload`
- **En-tête :** PORTEO
- **Utilisation :** `generateBlankDocument()`
- **Action :** Remplacer le téléchargement Markdown par Word

### 🔄 DocumentEditor.tsx
- **Fonction à modifier :** `downloadAsWord`
- **En-tête :** PORTEO
- **Utilisation :** `generateTemplateDocument()`
- **Action :** Remplacer l'appel API `/api/word` par le service Word

### 🔄 DocumentHistory.tsx
- **Fonction à modifier :** `handleDownload`
- **En-tête :** PORTEO (si document créé) ou Justicia (si analyse)
- **Utilisation :** `generateTemplateDocument()` ou `generateAnalysisDocument()`
- **Action :** Déterminer le type de document et utiliser la fonction appropriée

### 🔄 DocumentsList.tsx
- **Fonction à modifier :** `handleDownload`
- **En-tête :** PORTEO
- **Utilisation :** `generateBlankDocument()`
- **Action :** Remplacer l'appel API `/api/word` par le service Word

### 🔄 ReportGenerator.tsx
- **Fonction à modifier :** Fonction de téléchargement (ligne 189-194)
- **En-tête :** Justicia
- **Utilisation :** `generateAnalysisDocument()`
- **Action :** Remplacer l'appel API `/api/generate-docx` par le service Word

### 🔄 TemplateForm.tsx
- **Fonction à modifier :** `handleDownloadDocx`
- **En-tête :** PORTEO
- **Utilisation :** `generateTemplateDocument()`
- **Action :** Remplacer l'appel au service d'export par le service Word

### 🔄 TemplateFormGenerator.tsx
- **Fonction à modifier :** Fonction de génération (ligne 309)
- **En-tête :** PORTEO
- **Utilisation :** `generateTemplateDocument()`
- **Action :** Intégrer le service Word

## Logos

Les logos sont situés dans :
- **Justicia :** `/public/justicia-logo.png` (115 KB)
- **PORTEO :** `/public/templates/porteo-logo.png` (61 KB)

## Formats supportés

Le service convertit automatiquement le contenu Markdown en paragraphes Word :
- `# Titre` → Heading 1
- `## Titre` → Heading 2
- `### Titre` → Heading 3
- `**Texte**` → Texte en gras
- `- Item` → Liste à puces
- Paragraphes normaux

## Prochaines étapes

1. Intégrer le service dans les composants restants (🔄)
2. Tester la génération de documents Word pour chaque type
3. Vérifier que les en-têtes Justicia et PORTEO s'affichent correctement
4. Vérifier que le formatage Markdown est correct dans Word
5. Supprimer les anciens endpoints API (`/api/word`, `/api/generate-docx`) qui ne sont plus nécessaires

## Notes

- Le service fonctionne entièrement côté client (pas besoin de backend)
- Les documents sont téléchargés directement dans le navigateur
- Les logos sont chargés dynamiquement depuis le dossier `/public`
- Si le logo ne peut pas être chargé, un en-tête texte est utilisé en fallback
