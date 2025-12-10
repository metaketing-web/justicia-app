# Justicia V0.1

**Plateforme d'analyse intelligente de documents juridiques avec IA vocale**

---

## 📋 Vue d'ensemble

Justicia est une application web complète qui combine analyse de documents, génération de documents juridiques, intelligence artificielle conversationnelle et édition vocale en temps réel.

### 🎯 Fonctionnalités principales

#### 1. 📄 Analyse de Documents
- **Upload multi-formats** : PDF, DOCX, XLSX, TXT, MD, images (JPEG, PNG)
- **Analyse IA approfondie** : Extraction automatique des informations clés
- **Visualisations** : Graphiques et infographies interactives
- **Export** : Téléchargement des analyses en Word/PDF

#### 2. 💬 Chat IA Juridique
- **Assistant juridique intelligent** spécialisé en droit ivoirien
- **Base de connaissances** : Code du Travail Ivoirien intégré
- **RAG (Retrieval Augmented Generation)** : Réponses contextualisées
- **Historique** : Sauvegarde des conversations

#### 3. 📝 Génération de Documents
- **30 modèles professionnels** :
  - Courriers de validation de plans
  - Mises en demeure (avancement, qualité, HSE)
  - Demandes de réception (provisoire, définitive, partielle)
  - Contrats (transport, location, fourniture)
  - Conventions et protocoles
  - Conditions générales (vente, achat)
  
- **Document vierge** : Création libre avec en-tête Porteo
- **Remplissage intelligent** :
  - Formulaires dynamiques
  - Remplissage par IA (prompt)
  - Dictée vocale par champ

#### 4. 🎤 Édition Vocale
Deux modes vocaux intégrés :

**Mode 1 : Micro (🎤) - Transcription Speech-to-Text**
- Dictée vocale simple
- Transcription automatique en texte
- Ajout direct au document

**Mode 2 : Vagues (🌊) - Conversation IA Real-time**
- Conversation bidirectionnelle avec l'IA
- Modification du document par instructions vocales
- Exemples d'instructions :
  - "Ajoute une introduction"
  - "Corrige l'orthographe"
  - "Résume ce texte en 3 points"
  - "Supprime le dernier paragraphe"
  - "Reformule de manière plus formelle"

#### 5. 📚 Historique des Documents
- **Stockage local** de tous les documents générés
- **Filtres** par type (documents, chats, analyses, audio)
- **Recherche** dans l'historique
- **Téléchargement** et suppression
- Jusqu'à 500 documents sauvegardés

#### 6. 🎨 Branding Porteo
- **En-tête automatique** : Papier en-tête Porteo Group 2025
- **Couleurs personnalisées** :
  - Titres : #BA8A52 (or/bronze)
  - Texte : #17232E (bleu foncé)

---

## 🛠️ Technologies

### Frontend
- **React 19** avec TypeScript
- **Vite** pour le build
- **Tailwind CSS** pour le styling
- **Lucide React** pour les icônes
- **Recharts** pour les graphiques
- **React Markdown** pour le rendu markdown

### Backend
- **Node.js** avec Express
- **Python 3.11** pour le traitement de documents
- **python-docx** pour la génération Word
- **Whisper** pour la transcription audio

### IA & APIs
- **OpenAI GPT-4** pour le chat et l'analyse
- **OpenAI Whisper** pour Speech-to-Text
- **OpenAI TTS** avec voix Cedar
- **OpenAI Realtime API** pour la conversation vocale
- **Brave Search API** pour la recherche web

### Base de données
- **IndexedDB** pour le stockage local
- **LocalStorage** pour les préférences et l'historique

---

## 📦 Installation

### Prérequis
- Node.js 22.13.0+
- Python 3.11+
- npm ou pnpm

### Installation des dépendances

```bash
# Dépendances Node.js
npm install

# Dépendances Python
pip3 install python-docx
```

### Variables d'environnement

Créer un fichier `.env` :

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Brave Search
BRAVE_API_KEY=your_brave_api_key

# Firebase (optionnel)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

---

## 🚀 Démarrage

### Mode développement

```bash
# Terminal 1 : Frontend (Vite)
npm run dev

# Terminal 2 : Backend (Node.js)
node server.cjs
```

### Mode production

```bash
# Build
npm run build

# Démarrer le serveur
node server.cjs
```

L'application sera accessible sur `http://localhost:3001`

---

## 📁 Structure du projet

```
/home/ubuntu/
├── components/          # Composants React
│   ├── BlankDocumentEditor.tsx
│   ├── DocumentHistory.tsx
│   ├── DocumentVoiceEditor.tsx
│   ├── DocumentGenerationForm.tsx
│   ├── DocumentTemplateSelector.tsx
│   ├── RealtimeVoiceChat.tsx
│   └── ...
├── services/           # Services et APIs
│   ├── documentHistory.service.ts
│   ├── openai-realtime.service.ts
│   ├── ragService.enhanced.ts
│   └── ...
├── scripts/            # Scripts Python
│   ├── generate_blank_document.py
│   ├── fill_template_with_porteo_header.py
│   └── generate_report_from_template.py
├── public/
│   └── templates/      # Modèles Word (30 templates)
├── config/
│   └── documentTemplates.ts
├── server.cjs          # Serveur Express
├── App.tsx             # Application principale
└── index.html
```

---

## 🎯 Endpoints API

### Documents
- `POST /api/fill-template` - Remplir un modèle Word
- `POST /api/generate-blank-document` - Créer un document vierge
- `POST /api/generate-report` - Générer un rapport
- `POST /api/word` - Génération de documents Word
- `POST /api/generate-docx` - Génération DOCX

### IA & Chat
- `POST /api/chat` - Chat avec l'IA
- `POST /api/tts` - Text-to-Speech
- `POST /api/transcribe` - Transcription audio

### Recherche
- `POST /api/brave-search` - Recherche web via Brave

---

## 🎨 Fonctionnalités UI/UX

### Interface
- **Mode sombre** par défaut
- **Responsive** : Desktop, tablet, mobile
- **Animations** fluides avec Tailwind
- **Gradients** personnalisés Porteo (violet, rose, orange)

### Navigation
- **Sidebar** avec sessions de chat et dossiers
- **Menu utilisateur** : Connaissance, Compte, Paramètres, Aide
- **Raccourcis clavier** pour les actions fréquentes

### Paramètres
- Langue (FR, EN, ES, DE, IT, PT)
- Thème (clair, sombre, système)
- Notifications
- Rétention des données
- Sauvegarde automatique

---

## 📝 Modèles de documents disponibles

### Courriers
1. Validation de plans
2. Demande d'informations complémentaires
3. Relance demande d'informations

### Mises en demeure
4. Avancement des travaux
5. Qualité des travaux
6. HSE (Hygiène, Sécurité, Environnement)
7. Retard des entreprises (dévoiements de réseaux)

### Réceptions
8. Réception provisoire des travaux
9. Réception partielle provisoire
10. Réception définitive des travaux
11. Demande de paiement de retenue de garantie
12. Demande de levée de cautionnement définitif

### Contrats & Conventions
13. Contrat de transport (matériaux/fournitures)
14. Protocole transactionnel carrière
15. Contrat de location de terrain (stockage)
16. Contrat de mise en dépôt définitif de matériaux
17. Emprunt de matériaux en zone rurale
18. Mise à disposition de terrain nu (administration)
19. Mise à disposition de terrain nu (village)
20. Mise à disposition de terrain nu (particulier)
21. Contrat de location d'engins
22. Contrat de fourniture de matériaux
23. Convention pour les soins médicaux

### Autres
24. Demande de prolongation de délais
25. Réparation des dommages (déplacement de réseau)
26. Libération de l'emprise des travaux
27. Formalisation d'une instruction verbale
28. Atteinte de la masse initiale des travaux
29. Conditions générales de vente
30. Conditions générales d'achat

---

## 🔐 Sécurité & Confidentialité

- **Stockage local** : Toutes les données restent sur l'appareil
- **Pas de tracking** : Aucune donnée envoyée à des tiers
- **Chiffrement** : Communications HTTPS
- **Authentification** : Firebase Auth (optionnel)

---

## 🐛 Résolution de problèmes

### Le micro ne fonctionne pas
- Vérifier les permissions du navigateur
- Utiliser HTTPS ou localhost
- Tester avec un autre navigateur

### Les documents ne se génèrent pas
- Vérifier que Python 3.11 est installé
- Vérifier que python-docx est installé
- Consulter les logs du serveur

### L'IA ne répond pas
- Vérifier la clé API OpenAI dans `.env`
- Vérifier la connexion internet
- Consulter la console du navigateur

---

## 📄 Licence

Propriétaire - Porteo Group © 2025

---

## 👥 Auteurs

- **Développement** : Équipe Manus AI
- **Client** : Porteo Group
- **Version** : 0.1
- **Date** : Décembre 2025

---

## 🚧 Roadmap

### Version 0.2 (à venir)
- [ ] Export PDF direct
- [ ] Signature électronique
- [ ] Collaboration en temps réel
- [ ] Templates personnalisés
- [ ] Intégration cloud (Google Drive, Dropbox)

### Version 0.3 (à venir)
- [ ] Application mobile (React Native)
- [ ] Mode hors ligne complet
- [ ] OCR pour documents scannés
- [ ] Traduction automatique

---

## 📞 Support

Pour toute question ou assistance :
- **Email** : support@porteo.group
- **Documentation** : https://help.justicia.ai

---

**Justicia V0.1** - Analyse Intelligente de Documents Juridiques avec IA Vocale
