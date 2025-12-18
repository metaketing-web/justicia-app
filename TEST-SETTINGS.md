# Test des Paramètres Justicia

## Tests à effectuer

### 1. Thème
- [ ] Ouvrir les paramètres
- [ ] Changer le thème de "Sombre" à "Clair"
- [ ] Vérifier que l'interface change de couleur immédiatement
- [ ] Changer le thème à "Suivre le système"
- [ ] Vérifier que le thème suit celui du système d'exploitation
- [ ] Rafraîchir la page et vérifier que le thème est conservé

### 2. Langue
- [ ] Ouvrir les paramètres
- [ ] Changer la langue de "Français" à "English"
- [ ] Vérifier que tous les textes de l'interface sont traduits en anglais
- [ ] Tester avec les autres langues (Español, Deutsch, Italiano, Português)
- [ ] Rafraîchir la page et vérifier que la langue est conservée

### 3. Notifications
- [ ] Ouvrir les paramètres
- [ ] Activer "Envoyez-moi un email lorsque mon analyse commence"
- [ ] Une popup devrait demander la permission pour les notifications
- [ ] Accepter la permission
- [ ] Uploader un document
- [ ] Vérifier qu'une notification apparaît (toast + notification navigateur)

### 4. Sauvegarde automatique
- [ ] Ouvrir un éditeur de document
- [ ] Activer "Sauvegarde automatique" dans les paramètres
- [ ] Modifier le document
- [ ] Attendre 30 secondes
- [ ] Vérifier qu'un indicateur "Sauvegardé automatiquement" apparaît

### 5. Autres paramètres
- [ ] Activer/désactiver "Recevoir du contenu exclusif"
- [ ] Activer/désactiver "Afficher le résumé d'analyse automatiquement"
- [ ] Activer/désactiver "Chat vocal"
- [ ] Changer la "Durée de conservation des données"
- [ ] Cliquer sur "Enregistrer"
- [ ] Vérifier qu'une notification "Paramètres enregistrés" apparaît

### 6. Persistance
- [ ] Modifier plusieurs paramètres
- [ ] Fermer l'onglet du navigateur
- [ ] Rouvrir l'application
- [ ] Vérifier que tous les paramètres sont conservés

## Résultats attendus

### Thème
- ✅ Le thème change immédiatement sans rafraîchissement
- ✅ Les couleurs de fond, texte et bordures changent
- ✅ Le thème est conservé après rafraîchissement

### Langue
- ✅ Tous les textes visibles sont traduits
- ✅ La langue est conservée après rafraîchissement
- ✅ Les 6 langues fonctionnent correctement

### Notifications
- ✅ La permission est demandée au premier usage
- ✅ Les notifications toast apparaissent dans l'interface
- ✅ Les notifications push apparaissent dans le système (si permission accordée)
- ✅ Les notifications sont contextuelles (succès = vert, erreur = rouge, etc.)

### Sauvegarde automatique
- ✅ L'indicateur de sauvegarde apparaît toutes les 30 secondes
- ✅ L'indicateur montre "Sauvegardé automatiquement" en vert
- ✅ En cas d'erreur, l'indicateur montre "Erreur de sauvegarde" en rouge

### Persistance
- ✅ Tous les paramètres sont sauvegardés dans localStorage
- ✅ Les paramètres sont restaurés au chargement de l'application
- ✅ Les paramètres sont synchronisés avec le backend (TODO)

## Bugs connus

### À corriger
- [ ] La connexion au backend tRPC n'est pas encore implémentée (les paramètres sont sauvegardés uniquement dans localStorage)
- [ ] L'envoi d'emails réel n'est pas implémenté (seulement des logs console)
- [ ] La rétention automatique des données n'est pas implémentée (pas de tâche cron)

### Améliorations futures
- [ ] Ajouter plus de traductions pour couvrir 100% de l'interface
- [ ] Ajouter des animations de transition pour les changements de thème
- [ ] Ajouter un indicateur de chargement pendant la sauvegarde des paramètres
- [ ] Ajouter une confirmation avant de réinitialiser les paramètres par défaut
