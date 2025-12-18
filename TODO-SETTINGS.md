# TODO - Activation des Paramètres Justicia

## Paramètres identifiés dans AppSettings.tsx

### Général
- [x] Changement de langue (fr, en, es, de, it, pt) - Service i18n créé
- [x] Persister la langue dans la base de données (via settings)

### Apparence
- [x] Thème (light, dark, system) - Hook useSettings créé
- [x] Appliquer le thème en temps réel dans l'interface
- [x] Persister le thème dans la base de données (via settings)

### Notifications et Emails
- [ ] Recevoir du contenu exclusif - Connecter au backend
- [ ] Email lors du démarrage de tâche - Implémenter l'envoi d'emails
- [x] Système de notifications en temps réel - Service notification créé

### Fonctionnalités
- [x] Sauvegarde automatique des documents - Service autoSave créé
- [ ] Afficher le résumé d'analyse automatiquement - Vérifier le fonctionnement
- [ ] Chat vocal activé - Vérifier l'intégration avec OpenAI Realtime

### Données et Confidentialité
- [ ] Durée de conservation des données - Implémenter la suppression automatique
- [ ] Gestion des données utilisateur selon RGPD

## Actions à effectuer

1. **Connecter AppSettings au backend tRPC**
   - Charger les paramètres depuis le backend au démarrage
   - Sauvegarder les modifications dans la base de données (pas seulement localStorage)

2. **Implémenter le changement de langue**
   - Créer un système i18n
   - Traduire toutes les chaînes de l'interface

3. **Implémenter le système de thème**
   - Appliquer le thème sélectionné à toute l'application
   - Gérer le mode "system" (suivre le thème du système)

4. **Implémenter les notifications**
   - Notifications push dans le navigateur
   - Notifications par email (via backend)

5. **Implémenter l'auto-save**
   - Sauvegarder automatiquement les documents toutes les 30 secondes
   - Indicateur visuel de sauvegarde

6. **Implémenter la rétention des données**
   - Tâche cron pour supprimer les documents expirés
   - Avertir l'utilisateur avant suppression
