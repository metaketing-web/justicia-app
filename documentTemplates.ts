/**
 * Configuration des modèles de documents disponibles dans Justicia
 */

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  filename: string;
  fields: DocumentField[];
}

export interface DocumentField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
}

export const DOCUMENT_CATEGORIES = [
  { id: 'courriers', name: 'Courriers et Correspondances', icon: '📧' },
  { id: 'contrats', name: 'Contrats et Conventions', icon: '📝' },
  { id: 'mises_en_demeure', name: 'Mises en Demeure', icon: '⚠️' },
  { id: 'receptions', name: 'Réceptions de Travaux', icon: '✅' },
  { id: 'conditions', name: 'Conditions Générales', icon: '📋' },
];

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // COURRIERS
  {
    id: 'validation_plans',
    name: 'Validation de Plans',
    category: 'courriers',
    description: 'Courrier type pour la validation de plans de construction',
    filename: 'COURRIERTYPEDEVALIDATIONDEPLANS.docx',
    fields: [
      { id: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { id: 'projet', label: 'Nom du projet', type: 'text', required: true },
      { id: 'reference_plans', label: 'Référence des plans', type: 'text', required: true },
      { id: 'date_validation', label: 'Date de validation', type: 'date', required: true },
      { id: 'observations', label: 'Observations', type: 'textarea', placeholder: 'Observations éventuelles...' },
    ]
  },
  {
    id: 'demande_info_complementaires',
    name: 'Demande d\'Informations Complémentaires',
    category: 'courriers',
    description: 'Demande d\'informations complémentaires sur un dossier',
    filename: 'COURRIERTYPE-DEMANDED\'INFORMATIONCOMPLEMENTAIRES.docx',
    fields: [
      { id: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { id: 'reference_dossier', label: 'Référence du dossier', type: 'text', required: true },
      { id: 'informations_demandees', label: 'Informations demandées', type: 'textarea', required: true },
      { id: 'delai_reponse', label: 'Délai de réponse', type: 'text', placeholder: 'Ex: 15 jours' },
    ]
  },
  {
    id: 'relance_info_complementaires',
    name: 'Relance Demande d\'Informations',
    category: 'courriers',
    description: 'Relance pour informations complémentaires non fournies',
    filename: 'COURRIERTYPE-RELANCEDEMANDED\'INFORMATIONCOMPLEMENTAIRES.docx',
    fields: [
      { id: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { id: 'reference_courrier_initial', label: 'Référence courrier initial', type: 'text', required: true },
      { id: 'date_courrier_initial', label: 'Date courrier initial', type: 'date', required: true },
      { id: 'nouveau_delai', label: 'Nouveau délai', type: 'text' },
    ]
  },
  {
    id: 'retard_devoiement_reseaux',
    name: 'Retard Dévoiement de Réseaux',
    category: 'courriers',
    description: 'Courrier concernant le retard des entreprises chargées des dévoiements de réseaux',
    filename: 'MODELETYPERETARDDESENTREPRISECHARGEESDESDEVOIEMENTSDERESEAUX.docx',
    fields: [
      { id: 'entreprise', label: 'Nom de l\'entreprise', type: 'text', required: true },
      { id: 'type_reseau', label: 'Type de réseau', type: 'select', options: ['Électricité', 'Eau', 'Télécom', 'Gaz', 'Assainissement'], required: true },
      { id: 'delai_contractuel', label: 'Délai contractuel', type: 'date', required: true },
      { id: 'retard_jours', label: 'Retard (en jours)', type: 'number', required: true },
      { id: 'consequences', label: 'Conséquences du retard', type: 'textarea', required: true },
    ]
  },
  {
    id: 'deplacement_reseau_dommages',
    name: 'Déplacement de Réseau - Réparation Dommages',
    category: 'courriers',
    description: 'Courrier concernant la réparation de dommages suite au déplacement de réseau',
    filename: 'PORTEOBTP-COURRIERTYPE-DEPLACEMENTDERESEAU-REPARATIONDESDOMMAGES.docx',
    fields: [
      { id: 'concessionnaire', label: 'Concessionnaire', type: 'text', required: true },
      { id: 'nature_dommages', label: 'Nature des dommages', type: 'textarea', required: true },
      { id: 'date_constatation', label: 'Date de constatation', type: 'date', required: true },
      { id: 'montant_estime', label: 'Montant estimé', type: 'text' },
    ]
  },
  {
    id: 'liberation_emprise',
    name: 'Libération de l\'Emprise des Travaux',
    category: 'courriers',
    description: 'Demande de libération de l\'emprise des travaux',
    filename: 'MODELETYPEDECOURRIER-LIBERATIONDEL\'EMPRISEDESTRAVAUX.docx',
    fields: [
      { id: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation de l\'emprise', type: 'text', required: true },
      { id: 'date_liberation_souhaitee', label: 'Date de libération souhaitée', type: 'date', required: true },
      { id: 'motif', label: 'Motif de la demande', type: 'textarea', required: true },
    ]
  },
  {
    id: 'formalisation_instruction_verbale',
    name: 'Formalisation d\'une Instruction Verbale',
    category: 'courriers',
    description: 'Formalisation écrite d\'une instruction donnée verbalement',
    filename: 'MODELETYPEDECOURRIER-FORMALISATIOND\'UNEINSTRUCTIONVERBALE.docx',
    fields: [
      { id: 'destinataire', label: 'Destinataire', type: 'text', required: true },
      { id: 'date_instruction', label: 'Date de l\'instruction verbale', type: 'date', required: true },
      { id: 'lieu_instruction', label: 'Lieu', type: 'text' },
      { id: 'contenu_instruction', label: 'Contenu de l\'instruction', type: 'textarea', required: true },
      { id: 'delai_execution', label: 'Délai d\'exécution', type: 'text' },
    ]
  },
  {
    id: 'atteinte_masse_initiale',
    name: 'Atteinte de la Masse Initiale des Travaux',
    category: 'courriers',
    description: 'Notification de l\'atteinte de la masse initiale des travaux',
    filename: 'MODELETYPECOURRIER-ATTEINTEDELAMASSEINITIALEDESTRAVAUX.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'montant_initial', label: 'Montant initial du marché', type: 'text', required: true },
      { id: 'montant_atteint', label: 'Montant atteint', type: 'text', required: true },
      { id: 'date_atteinte', label: 'Date d\'atteinte', type: 'date', required: true },
      { id: 'travaux_restants', label: 'Travaux restants', type: 'textarea' },
    ]
  },

  // MISES EN DEMEURE
  {
    id: 'mise_en_demeure_avancement',
    name: 'Mise en Demeure - Avancement des Travaux',
    category: 'mises_en_demeure',
    description: 'Mise en demeure concernant l\'avancement des travaux',
    filename: 'PORTEOBTPCI-MODELETYPEMISEENDEMEUREAVANCEMENTDESTRAVAUX-NOUVELLEMOUTUREDECONTRATS.docx',
    fields: [
      { id: 'entreprise', label: 'Entreprise', type: 'text', required: true },
      { id: 'reference_marche', label: 'Référence du marché', type: 'text', required: true },
      { id: 'avancement_prevu', label: 'Avancement prévu (%)', type: 'number', required: true },
      { id: 'avancement_reel', label: 'Avancement réel (%)', type: 'number', required: true },
      { id: 'delai_regularisation', label: 'Délai de régularisation', type: 'text', required: true },
      { id: 'penalites', label: 'Pénalités applicables', type: 'textarea' },
    ]
  },
  {
    id: 'mise_en_demeure_qualite',
    name: 'Mise en Demeure - Qualité des Travaux',
    category: 'mises_en_demeure',
    description: 'Mise en demeure concernant la qualité des travaux',
    filename: 'PORTEOBTPCI-MISEENDEMEUREQUALITEDESTRAVAUX-NOUVELLEMOUTUREDECONTRATS.docx',
    fields: [
      { id: 'entreprise', label: 'Entreprise', type: 'text', required: true },
      { id: 'reference_marche', label: 'Référence du marché', type: 'text', required: true },
      { id: 'malfacons_constatees', label: 'Malfaçons constatées', type: 'textarea', required: true },
      { id: 'date_constatation', label: 'Date de constatation', type: 'date', required: true },
      { id: 'delai_reprise', label: 'Délai de reprise', type: 'text', required: true },
    ]
  },
  {
    id: 'mise_en_demeure_hse',
    name: 'Mise en Demeure - HSE',
    category: 'mises_en_demeure',
    description: 'Mise en demeure concernant l\'hygiène, sécurité et environnement',
    filename: 'PORTEOBTPCI-MISEENDEMEUREHSE-NOUVELLEMOUTUREDECONTRATS.docx',
    fields: [
      { id: 'entreprise', label: 'Entreprise', type: 'text', required: true },
      { id: 'reference_marche', label: 'Référence du marché', type: 'text', required: true },
      { id: 'manquements_constates', label: 'Manquements constatés', type: 'textarea', required: true },
      { id: 'risques_identifies', label: 'Risques identifiés', type: 'textarea', required: true },
      { id: 'mesures_correctives', label: 'Mesures correctives exigées', type: 'textarea', required: true },
      { id: 'delai_mise_conformite', label: 'Délai de mise en conformité', type: 'text', required: true },
    ]
  },

  // RÉCEPTIONS
  {
    id: 'demande_reception_provisoire',
    name: 'Demande de Réception Provisoire',
    category: 'receptions',
    description: 'Demande de réception provisoire des travaux',
    filename: 'PORTOBTP-MODELETYPEDEDEMANDEDERECEPTIONPROVISOIREDESTRAVAUX.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'objet_travaux', label: 'Objet des travaux', type: 'text', required: true },
      { id: 'date_achevement', label: 'Date d\'achèvement', type: 'date', required: true },
      { id: 'date_reception_proposee', label: 'Date de réception proposée', type: 'date', required: true },
      { id: 'documents_joints', label: 'Documents joints', type: 'textarea' },
    ]
  },
  {
    id: 'reception_partielle_provisoire',
    name: 'Réception Partielle Provisoire',
    category: 'receptions',
    description: 'Procès-verbal de réception partielle provisoire',
    filename: 'PORTEOBTP-MODELETYPERECEPTIONPARTIELLEPROVISOIRE.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'partie_recue', label: 'Partie des travaux reçue', type: 'text', required: true },
      { id: 'date_reception', label: 'Date de réception', type: 'date', required: true },
      { id: 'reserves', label: 'Réserves', type: 'textarea' },
      { id: 'delai_levee_reserves', label: 'Délai de levée des réserves', type: 'text' },
    ]
  },
  {
    id: 'demande_reception_definitive',
    name: 'Demande de Réception Définitive',
    category: 'receptions',
    description: 'Demande de réception définitive des travaux',
    filename: 'PORTEOBTP-MODELETYPEDEMANDEDERECEPTIONDEFINITIVEDESTRAVAUX.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'date_reception_provisoire', label: 'Date de réception provisoire', type: 'date', required: true },
      { id: 'delai_garantie_ecoule', label: 'Délai de garantie écoulé', type: 'text', required: true },
      { id: 'date_reception_definitive_proposee', label: 'Date de réception définitive proposée', type: 'date', required: true },
    ]
  },
  {
    id: 'demande_paiement_retenue_garantie',
    name: 'Demande de Paiement Retenue de Garantie',
    category: 'receptions',
    description: 'Demande de paiement de la retenue de garantie / mainlevée sur la caution',
    filename: 'PORTEOBTP-MODELETYPEDEDEMANDEDEPAIEMENTDELARETENUEDEGARANTIE-MAINLEVEESURLACAUTION.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'montant_retenue', label: 'Montant de la retenue', type: 'text', required: true },
      { id: 'date_reception_definitive', label: 'Date de réception définitive', type: 'date', required: true },
      { id: 'reference_caution', label: 'Référence de la caution', type: 'text' },
    ]
  },
  {
    id: 'demande_levee_cautionnement',
    name: 'Demande de Levée de Cautionnement Définitif',
    category: 'receptions',
    description: 'Demande de levée du cautionnement définitif',
    filename: 'PORTEOBTP-MODELETYPEDEDEMANDEDELEVEEDECAUTIONNEMENTDEFINITIF.docx',
    fields: [
      { id: 'organisme_caution', label: 'Organisme de caution', type: 'text', required: true },
      { id: 'reference_caution', label: 'Référence de la caution', type: 'text', required: true },
      { id: 'montant_caution', label: 'Montant de la caution', type: 'text', required: true },
      { id: 'date_reception_definitive', label: 'Date de réception définitive', type: 'date', required: true },
    ]
  },

  // CONTRATS
  {
    id: 'contrat_transport_materiaux',
    name: 'Contrat de Transport de Matériaux',
    category: 'contrats',
    description: 'Contrat type de transport de matériaux ou fournitures',
    filename: 'CONTRATTYPEDETRANSPORTMATERIAUXOUDEFOURNITURES.docx',
    fields: [
      { id: 'transporteur', label: 'Nom du transporteur', type: 'text', required: true },
      { id: 'donneur_ordre', label: 'Donneur d\'ordre', type: 'text', required: true },
      { id: 'nature_materiaux', label: 'Nature des matériaux', type: 'text', required: true },
      { id: 'quantite', label: 'Quantité', type: 'text', required: true },
      { id: 'lieu_chargement', label: 'Lieu de chargement', type: 'text', required: true },
      { id: 'lieu_livraison', label: 'Lieu de livraison', type: 'text', required: true },
      { id: 'tarif', label: 'Tarif', type: 'text', required: true },
      { id: 'duree_contrat', label: 'Durée du contrat', type: 'text', required: true },
    ]
  },
  {
    id: 'protocole_transactionnel_carriere',
    name: 'Protocole Transactionnel Carrière',
    category: 'contrats',
    description: 'Modèle type de protocole transactionnel pour exploitation de carrière',
    filename: 'MODELETYPEPROTOCOLETRANSACTIONNELCARRIERE.docx',
    fields: [
      { id: 'exploitant', label: 'Exploitant', type: 'text', required: true },
      { id: 'proprietaire', label: 'Propriétaire du terrain', type: 'text', required: true },
      { id: 'localisation_carriere', label: 'Localisation de la carrière', type: 'text', required: true },
      { id: 'superficie', label: 'Superficie', type: 'text', required: true },
      { id: 'duree_exploitation', label: 'Durée d\'exploitation', type: 'text', required: true },
      { id: 'redevance', label: 'Redevance', type: 'text', required: true },
    ]
  },
  {
    id: 'location_terrain_stockage',
    name: 'Location de Terrain pour Stockage',
    category: 'contrats',
    description: 'Contrat de location de terrain pour stockage de matériaux',
    filename: 'CONTRATDELOCATIONDETERRAINPOURSTOCKAGEDEMATERIAUX.docx',
    fields: [
      { id: 'bailleur', label: 'Bailleur', type: 'text', required: true },
      { id: 'locataire', label: 'Locataire', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation du terrain', type: 'text', required: true },
      { id: 'superficie', label: 'Superficie', type: 'text', required: true },
      { id: 'loyer', label: 'Loyer mensuel', type: 'text', required: true },
      { id: 'duree_location', label: 'Durée de location', type: 'text', required: true },
      { id: 'usage', label: 'Usage autorisé', type: 'textarea', required: true },
    ]
  },
  {
    id: 'mise_en_depot_materiaux',
    name: 'Mise en Dépôt Définitif de Matériaux',
    category: 'contrats',
    description: 'Contrat de mise en dépôt définitif de matériaux',
    filename: 'MODELETYPEDECONTRATDEMISEENDEPOTDEFINITIFDEMATERIAUX.docx',
    fields: [
      { id: 'proprietaire', label: 'Propriétaire du terrain', type: 'text', required: true },
      { id: 'deposant', label: 'Déposant', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation', type: 'text', required: true },
      { id: 'nature_materiaux', label: 'Nature des matériaux', type: 'text', required: true },
      { id: 'volume_estime', label: 'Volume estimé', type: 'text', required: true },
      { id: 'indemnisation', label: 'Indemnisation', type: 'text', required: true },
    ]
  },
  {
    id: 'emprunt_materiaux_rural',
    name: 'Emprunt de Matériaux en Zone Rurale',
    category: 'contrats',
    description: 'Convention d\'emprunt de matériaux en zone rurale',
    filename: 'EMPRUNTDEMATERIAUXENZONERURALE.docx',
    fields: [
      { id: 'village', label: 'Village/Communauté', type: 'text', required: true },
      { id: 'representant', label: 'Représentant', type: 'text', required: true },
      { id: 'emprunteur', label: 'Emprunteur', type: 'text', required: true },
      { id: 'localisation_zone', label: 'Localisation de la zone d\'emprunt', type: 'text', required: true },
      { id: 'nature_materiaux', label: 'Nature des matériaux', type: 'text', required: true },
      { id: 'volume_autorise', label: 'Volume autorisé', type: 'text', required: true },
      { id: 'compensation', label: 'Compensation', type: 'textarea', required: true },
    ]
  },
  {
    id: 'mise_disposition_terrain_administration',
    name: 'Mise à Disposition Terrain - Administration',
    category: 'contrats',
    description: 'Mise à disposition de terrain nu par une administration',
    filename: 'PORTEOBTPCI-MODELETYPE-MISEADISPOSITIONDETERRAINNUPARUNEADMINISTRATION.docx',
    fields: [
      { id: 'administration', label: 'Administration', type: 'text', required: true },
      { id: 'beneficiaire', label: 'Bénéficiaire', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation', type: 'text', required: true },
      { id: 'superficie', label: 'Superficie', type: 'text', required: true },
      { id: 'duree', label: 'Durée', type: 'text', required: true },
      { id: 'usage', label: 'Usage', type: 'textarea', required: true },
    ]
  },
  {
    id: 'mise_disposition_terrain_village',
    name: 'Mise à Disposition Terrain - Village',
    category: 'contrats',
    description: 'Mise à disposition de terrain nu par un village',
    filename: 'PORTEOBTPCI-MODELETYPE-MISEADISPOSITIONDETERRAINNUPARUNVILLAGE.docx',
    fields: [
      { id: 'village', label: 'Village', type: 'text', required: true },
      { id: 'chef_village', label: 'Chef de village', type: 'text', required: true },
      { id: 'beneficiaire', label: 'Bénéficiaire', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation', type: 'text', required: true },
      { id: 'superficie', label: 'Superficie', type: 'text', required: true },
      { id: 'duree', label: 'Durée', type: 'text', required: true },
      { id: 'compensation', label: 'Compensation', type: 'textarea' },
    ]
  },
  {
    id: 'mise_disposition_terrain_particulier',
    name: 'Mise à Disposition Terrain - Particulier',
    category: 'contrats',
    description: 'Mise à disposition de terrain nu par un particulier',
    filename: 'PORTEOBTPCI-MODELETYPE-MISEADISPOSITIONDETERRAINNUPARUNPARTICULIER.docx',
    fields: [
      { id: 'proprietaire', label: 'Propriétaire', type: 'text', required: true },
      { id: 'beneficiaire', label: 'Bénéficiaire', type: 'text', required: true },
      { id: 'localisation', label: 'Localisation', type: 'text', required: true },
      { id: 'superficie', label: 'Superficie', type: 'text', required: true },
      { id: 'duree', label: 'Durée', type: 'text', required: true },
      { id: 'loyer', label: 'Loyer', type: 'text' },
    ]
  },
  {
    id: 'location_engins',
    name: 'Location d\'Engins',
    category: 'contrats',
    description: 'Contrat de location d\'engins de chantier',
    filename: 'CONTRATDELOCATIOND\'ENGINS.docx',
    fields: [
      { id: 'loueur', label: 'Loueur', type: 'text', required: true },
      { id: 'locataire', label: 'Locataire', type: 'text', required: true },
      { id: 'type_engin', label: 'Type d\'engin', type: 'text', required: true },
      { id: 'marque_modele', label: 'Marque et modèle', type: 'text' },
      { id: 'tarif_location', label: 'Tarif de location', type: 'text', required: true },
      { id: 'duree_location', label: 'Durée de location', type: 'text', required: true },
      { id: 'avec_chauffeur', label: 'Avec chauffeur', type: 'select', options: ['Oui', 'Non'], required: true },
    ]
  },
  {
    id: 'fourniture_materiaux',
    name: 'Fourniture de Matériaux',
    category: 'contrats',
    description: 'Contrat type de fourniture de matériaux',
    filename: 'PORTEOBTPCI-MODELETYPECONTRATDEFOURNITUREDEMATERIAUX.docx',
    fields: [
      { id: 'fournisseur', label: 'Fournisseur', type: 'text', required: true },
      { id: 'acheteur', label: 'Acheteur', type: 'text', required: true },
      { id: 'designation_materiaux', label: 'Désignation des matériaux', type: 'textarea', required: true },
      { id: 'quantite', label: 'Quantité', type: 'text', required: true },
      { id: 'prix_unitaire', label: 'Prix unitaire', type: 'text', required: true },
      { id: 'delai_livraison', label: 'Délai de livraison', type: 'text', required: true },
      { id: 'lieu_livraison', label: 'Lieu de livraison', type: 'text', required: true },
    ]
  },
  {
    id: 'convention_soins_medicaux',
    name: 'Convention pour Soins Médicaux',
    category: 'contrats',
    description: 'Convention pour la prise en charge des soins médicaux',
    filename: 'CONVENTIONPOURLESSOINSMEDICAUX-MODELE.docx',
    fields: [
      { id: 'etablissement_sante', label: 'Établissement de santé', type: 'text', required: true },
      { id: 'entreprise', label: 'Entreprise', type: 'text', required: true },
      { id: 'nombre_beneficiaires', label: 'Nombre de bénéficiaires', type: 'number', required: true },
      { id: 'prestations_couvertes', label: 'Prestations couvertes', type: 'textarea', required: true },
      { id: 'tarifs', label: 'Tarifs', type: 'textarea', required: true },
      { id: 'duree_convention', label: 'Durée de la convention', type: 'text', required: true },
    ]
  },
  {
    id: 'demande_prolongation_delais',
    name: 'Demande de Prolongation de Délais',
    category: 'contrats',
    description: 'Demande de prolongation des délais d\'exécution',
    filename: 'MODELETYPEDEMANDEDEPROLONGATIONDEDELAIS.docx',
    fields: [
      { id: 'maitre_ouvrage', label: 'Maître d\'ouvrage', type: 'text', required: true },
      { id: 'reference_marche', label: 'Référence du marché', type: 'text', required: true },
      { id: 'delai_initial', label: 'Délai initial', type: 'text', required: true },
      { id: 'prolongation_demandee', label: 'Prolongation demandée', type: 'text', required: true },
      { id: 'motifs', label: 'Motifs de la demande', type: 'textarea', required: true },
      { id: 'justificatifs', label: 'Justificatifs', type: 'textarea' },
    ]
  },

  // CONDITIONS GÉNÉRALES
  {
    id: 'conditions_generales_vente',
    name: 'Conditions Générales de Vente',
    category: 'conditions',
    description: 'Conditions générales de vente',
    filename: 'CONDITIONSGENERALESDEVENTE.docx',
    fields: [
      { id: 'entreprise', label: 'Nom de l\'entreprise', type: 'text', required: true },
      { id: 'siret', label: 'SIRET', type: 'text', required: true },
      { id: 'adresse', label: 'Adresse', type: 'textarea', required: true },
      { id: 'activite', label: 'Activité', type: 'text', required: true },
    ]
  },
  {
    id: 'conditions_generales_achat',
    name: 'Conditions Générales d\'Achat',
    category: 'conditions',
    description: 'Conditions générales d\'achat',
    filename: 'CONDITIONSGENERALESD\'ACHAT.docx',
    fields: [
      { id: 'entreprise', label: 'Nom de l\'entreprise', type: 'text', required: true },
      { id: 'siret', label: 'SIRET', type: 'text', required: true },
      { id: 'adresse', label: 'Adresse', type: 'textarea', required: true },
      { id: 'activite', label: 'Activité', type: 'text', required: true },
    ]
  },
];
