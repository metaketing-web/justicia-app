# Configuration du Déploiement Automatique

## 🎯 Objectif

Déployer automatiquement l'application Justicia sur AWS à chaque push sur GitHub.

---

## 📋 Prérequis

1. Compte GitHub avec accès au dépôt `metaketing-web/justicia-app`
2. Serveur AWS EC2 avec l'application Justicia
3. Clé SSH pour se connecter au serveur AWS

---

## ⚙️ Configuration des Secrets GitHub

### Étape 1 : Aller dans les paramètres du dépôt

1. Allez sur https://github.com/metaketing-web/justicia-app
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

### Étape 2 : Ajouter les 3 secrets suivants

#### Secret 1 : `AWS_HOST`
- **Name:** `AWS_HOST`
- **Value:** `13.60.86.219`
- Cliquez sur **Add secret**

#### Secret 2 : `AWS_USERNAME`
- **Name:** `AWS_USERNAME`
- **Value:** `admin`
- Cliquez sur **Add secret**

#### Secret 3 : `AWS_SSH_KEY`
- **Name:** `AWS_SSH_KEY`
- **Value:** Contenu complet du fichier `clef_vha.pem`
  
  Pour obtenir le contenu :
  ```bash
  cat ~/clef_vha.pem
  ```
  
  Copiez TOUT le contenu (y compris les lignes `-----BEGIN RSA PRIVATE KEY-----` et `-----END RSA PRIVATE KEY-----`)
  
- Cliquez sur **Add secret**

---

## 🚀 Comment ça fonctionne

### Déclenchement automatique

Le workflow se déclenche automatiquement quand :
- Vous faites un `git push` sur la branche `main`
- Vous faites un `git push` sur la branche `feature/build-fix-and-typescript-corrections`

### Déclenchement manuel

Vous pouvez aussi déclencher le déploiement manuellement :
1. Allez sur https://github.com/metaketing-web/justicia-app/actions
2. Cliquez sur **Deploy to AWS** dans la liste des workflows
3. Cliquez sur **Run workflow**
4. Sélectionnez la branche
5. Cliquez sur **Run workflow**

---

## 📝 Processus de déploiement

Quand un push est détecté, GitHub Actions :

1. ✅ Se connecte au serveur AWS via SSH
2. ✅ Va dans le dossier de l'application
3. ✅ Fait un `git pull` pour récupérer les dernières modifications
4. ✅ Installe les dépendances npm si nécessaire
5. ✅ Redémarre le serveur Node.js
6. ✅ Vérifie que le serveur tourne correctement
7. ✅ Envoie une notification de succès ou d'échec

**Durée estimée :** 30-60 secondes

---

## 🔍 Vérifier le déploiement

### Sur GitHub

1. Allez sur https://github.com/metaketing-web/justicia-app/actions
2. Vous verrez la liste des déploiements avec leur statut (✅ ou ❌)
3. Cliquez sur un déploiement pour voir les logs détaillés

### Sur le serveur AWS

```bash
# Se connecter au serveur
ssh -i ~/clef_vha.pem admin@13.60.86.219

# Vérifier que le serveur tourne
ps aux | grep "node server.cjs"

# Voir les logs du serveur
tail -f ~/justicia-app/server.log
```

### Sur l'application

Ouvrez https://app.justicia.ci dans votre navigateur et vérifiez que tout fonctionne.

---

## 🐛 Dépannage

### Le déploiement échoue

1. Vérifiez les logs sur GitHub Actions
2. Vérifiez que les secrets sont correctement configurés
3. Vérifiez que le serveur AWS est accessible
4. Vérifiez que le dépôt Git existe sur le serveur

### Le serveur ne démarre pas

```bash
# Se connecter au serveur
ssh -i ~/clef_vha.pem admin@13.60.86.219

# Voir les logs d'erreur
cat ~/justicia-app/server.log

# Redémarrer manuellement
cd ~/justicia-app
node server.cjs
```

---

## 📞 Support

En cas de problème, contactez l'équipe de développement avec :
- Les logs GitHub Actions
- Les logs du serveur (`server.log`)
- La description du problème

---

## ✨ Avantages

- ✅ **Déploiement automatique** : Plus besoin de se connecter en SSH
- ✅ **Traçabilité** : Tous les déploiements sont enregistrés
- ✅ **Rapidité** : Déploiement en moins d'une minute
- ✅ **Fiabilité** : Vérification automatique du succès
- ✅ **Rollback facile** : Possibilité de revenir à une version précédente

---

**Date de création :** 18 décembre 2025  
**Version :** 1.0.0
