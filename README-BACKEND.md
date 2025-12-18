# Justicia Backend - Guide de déploiement AWS

## Architecture

Le backend Justicia est construit avec :
- **Express.js** + **tRPC** pour l'API
- **Drizzle ORM** pour la base de données
- **MySQL** (AWS RDS recommandé)
- **S3** pour le stockage de fichiers
- **OpenAI API** pour le RAG et l'IA

## Prérequis AWS

### 1. Base de données RDS (MySQL)

Créer une instance MySQL sur AWS RDS :
```bash
# Via AWS Console ou CLI
aws rds create-db-instance \
  --db-instance-identifier justicia-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20
```

Récupérer l'endpoint de connexion (ex: `justicia-db.xxxxx.us-east-1.rds.amazonaws.com`)

### 2. Bucket S3

Créer un bucket S3 pour le stockage des documents :
```bash
aws s3 mb s3://justicia-documents --region us-east-1
```

Configurer les permissions CORS sur le bucket :
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://app.justicia.ci"],
    "ExposeHeaders": []
  }
]
```

### 3. IAM User pour S3

Créer un utilisateur IAM avec accès S3 :
```bash
aws iam create-user --user-name justicia-s3-user
aws iam attach-user-policy --user-name justicia-s3-user --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam create-access-key --user-name justicia-s3-user
```

Sauvegarder l'Access Key ID et Secret Access Key.

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/metaketing-web/justicia-app.git
cd justicia-app
npm install
```

### 2. Configuration des variables d'environnement

Créer un fichier `.env` à la racine :

```bash
# Base de données
DATABASE_URL=mysql://admin:password@justicia-db.xxxxx.us-east-1.rds.amazonaws.com:3306/justicia

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# S3
AWS_S3_BUCKET=justicia-documents
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Serveur
PORT=3001
FRONTEND_URL=https://app.justicia.ci
```

### 3. Initialiser la base de données

```bash
# Générer et appliquer les migrations
npm run db:push
```

### 4. Build du projet

```bash
# Build frontend
npm run build

# Build backend
npm run build:server
```

## Déploiement sur EC2

### 1. Lancer une instance EC2

```bash
# Ubuntu 22.04 LTS, t3.medium recommandé
# Ouvrir les ports 80, 443, 3001 dans le Security Group
```

### 2. Installer Node.js sur l'instance

```bash
ssh ubuntu@your-ec2-ip

# Installer Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 pour la gestion des processus
sudo npm install -g pm2
```

### 3. Déployer le code

```bash
# Sur votre machine locale
scp -r dist dist-server package.json ubuntu@your-ec2-ip:~/justicia/

# Sur l'instance EC2
cd ~/justicia
npm install --production
```

### 4. Configurer les variables d'environnement

```bash
# Sur l'instance EC2
nano .env
# Copier les variables d'environnement
```

### 5. Démarrer le serveur avec PM2

```bash
# Démarrer le backend
pm2 start dist-server/index.js --name justicia-backend

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

### 6. Configurer Nginx comme reverse proxy

```bash
sudo apt-get install nginx

sudo nano /etc/nginx/sites-available/justicia
```

Configuration Nginx :
```nginx
server {
    listen 80;
    server_name app.justicia.ci;

    # Frontend (fichiers statiques)
    location / {
        root /home/ubuntu/justicia/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :
```bash
sudo ln -s /etc/nginx/sites-available/justicia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configurer HTTPS avec Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d app.justicia.ci
```

## Mise à jour du déploiement

```bash
# Sur votre machine locale
git pull origin main
npm run build
npm run build:server

# Transférer vers EC2
scp -r dist dist-server ubuntu@your-ec2-ip:~/justicia/

# Sur l'instance EC2
cd ~/justicia
pm2 restart justicia-backend
```

## Monitoring

```bash
# Voir les logs
pm2 logs justicia-backend

# Voir le statut
pm2 status

# Monitoring en temps réel
pm2 monit
```

## Structure des fichiers backend

```
server/
├── _core/              # Core tRPC et infrastructure
│   ├── index.ts        # Point d'entrée du serveur
│   ├── trpc.ts         # Configuration tRPC
│   ├── context.ts      # Context tRPC (user, req, res)
│   └── ...
├── routers/            # Routes API
│   ├── documents.ts    # CRUD documents
│   ├── rag.ts          # Recherche RAG
│   ├── settings.ts     # Paramètres utilisateur
│   └── permissions.ts  # Permissions documents
├── services/           # Services métier
│   └── rag.ts          # Service RAG (extraction, chunking, embeddings)
├── db.ts               # Fonctions base de données
├── routers.ts          # Router principal
└── storage.ts          # Gestion S3

drizzle/
├── schema.ts           # Schéma de base de données
└── migrations/         # Migrations SQL

shared/
└── const.ts            # Constantes partagées
```

## Endpoints API

### Documents
- `POST /api/trpc/documents.create` - Créer un document
- `GET /api/trpc/documents.list` - Lister les documents
- `GET /api/trpc/documents.get` - Récupérer un document
- `PUT /api/trpc/documents.update` - Mettre à jour un document
- `DELETE /api/trpc/documents.delete` - Supprimer un document
- `POST /api/trpc/documents.upload` - Upload de fichier

### RAG
- `POST /api/trpc/rag.process` - Traiter un document pour le RAG
- `POST /api/trpc/rag.search` - Rechercher dans les documents
- `POST /api/trpc/rag.chat` - Chat avec l'assistant IA

### Paramètres
- `GET /api/trpc/settings.get` - Récupérer les paramètres
- `PUT /api/trpc/settings.update` - Mettre à jour les paramètres

### Permissions
- `POST /api/trpc/permissions.share` - Partager un document
- `GET /api/trpc/permissions.list` - Lister les permissions
- `DELETE /api/trpc/permissions.revoke` - Révoquer un accès

## Troubleshooting

### Erreur de connexion à la base de données
- Vérifier que le Security Group RDS autorise les connexions depuis l'EC2
- Vérifier l'URL de connexion dans `.env`

### Erreur S3
- Vérifier les credentials AWS
- Vérifier les permissions du bucket

### Le serveur ne démarre pas
```bash
pm2 logs justicia-backend --lines 100
```

## Support

Pour toute question : contact@justicia.ci
