/**
 * Système de traduction i18n pour Justicia
 * Supporte: Français, English, Español, Deutsch, Italiano, Português
 */

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt';

export interface Translations {
    [key: string]: string | Translations;
}

// Traductions pour toutes les langues
const translations: Record<Language, Translations> = {
    fr: {
        common: {
            welcome: 'Bienvenue',
            loading: 'Chargement...',
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            close: 'Fermer',
            search: 'Rechercher',
            upload: 'Télécharger',
            download: 'Télécharger',
            share: 'Partager',
            settings: 'Paramètres',
            logout: 'Déconnexion',
            login: 'Connexion',
            yes: 'Oui',
            no: 'Non',
            confirm: 'Confirmer',
        },
        chat: {
            newChat: 'Nouveau Chat',
            placeholder: 'Posez une question...',
            send: 'Envoyer',
            typing: 'En train d\'écrire...',
        },
        documents: {
            title: 'Documents',
            upload: 'Importer un document',
            myDocuments: 'Mes documents',
            recent: 'Récents',
            shared: 'Partagés',
            noDocuments: 'Aucun document',
            analyzing: 'Analyse en cours...',
            analysisComplete: 'Analyse terminée',
        },
        settings: {
            title: 'Paramètres',
            general: 'Général',
            appearance: 'Apparence',
            notifications: 'Notifications',
            privacy: 'Confidentialité',
            language: 'Langue',
            theme: 'Thème',
            themeLight: 'Clair',
            themeDark: 'Sombre',
            themeSystem: 'Suivre le système',
            autoSave: 'Sauvegarde automatique',
            autoSaveDesc: 'Enregistre automatiquement vos documents toutes les 30 secondes',
            voiceChat: 'Chat vocal',
            voiceChatDesc: 'Permet d\'utiliser la fonctionnalité de chat vocal',
            dataRetention: 'Durée de conservation des données',
            emailNotifications: 'Notifications par email',
            emailNotificationsDesc: 'Envoyez-moi un email lorsque mon analyse commence',
            exclusiveContent: 'Contenu exclusif',
            exclusiveContentDesc: 'Recevoir des offres exclusives et des mises à jour',
        },
        assistant: {
            greeting: 'Bonjour ! Je suis votre assistant IA Justicia.',
            uploadPrompt: 'Téléchargez un document ou posez-moi une question pour commencer.',
            analyzing: 'Analyse de votre document en cours...',
            ready: 'Prêt à répondre à vos questions',
        },
        errors: {
            generic: 'Une erreur est survenue',
            uploadFailed: 'Échec du téléchargement',
            analysisFailed: 'Échec de l\'analyse',
            saveFailed: 'Échec de la sauvegarde',
            networkError: 'Erreur de connexion',
        },
    },
    en: {
        common: {
            welcome: 'Welcome',
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            search: 'Search',
            upload: 'Upload',
            download: 'Download',
            share: 'Share',
            settings: 'Settings',
            logout: 'Logout',
            login: 'Login',
            yes: 'Yes',
            no: 'No',
            confirm: 'Confirm',
        },
        chat: {
            newChat: 'New Chat',
            placeholder: 'Ask a question...',
            send: 'Send',
            typing: 'Typing...',
        },
        documents: {
            title: 'Documents',
            upload: 'Upload document',
            myDocuments: 'My documents',
            recent: 'Recent',
            shared: 'Shared',
            noDocuments: 'No documents',
            analyzing: 'Analyzing...',
            analysisComplete: 'Analysis complete',
        },
        settings: {
            title: 'Settings',
            general: 'General',
            appearance: 'Appearance',
            notifications: 'Notifications',
            privacy: 'Privacy',
            language: 'Language',
            theme: 'Theme',
            themeLight: 'Light',
            themeDark: 'Dark',
            themeSystem: 'Follow system',
            autoSave: 'Auto-save',
            autoSaveDesc: 'Automatically saves your documents every 30 seconds',
            voiceChat: 'Voice chat',
            voiceChatDesc: 'Enables voice chat functionality',
            dataRetention: 'Data retention period',
            emailNotifications: 'Email notifications',
            emailNotificationsDesc: 'Send me an email when my analysis starts',
            exclusiveContent: 'Exclusive content',
            exclusiveContentDesc: 'Receive exclusive offers and updates',
        },
        assistant: {
            greeting: 'Hello! I am your Justicia AI assistant.',
            uploadPrompt: 'Upload a document or ask me a question to get started.',
            analyzing: 'Analyzing your document...',
            ready: 'Ready to answer your questions',
        },
        errors: {
            generic: 'An error occurred',
            uploadFailed: 'Upload failed',
            analysisFailed: 'Analysis failed',
            saveFailed: 'Save failed',
            networkError: 'Network error',
        },
    },
    es: {
        common: {
            welcome: 'Bienvenido',
            loading: 'Cargando...',
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            close: 'Cerrar',
            search: 'Buscar',
            upload: 'Subir',
            download: 'Descargar',
            share: 'Compartir',
            settings: 'Configuración',
            logout: 'Cerrar sesión',
            login: 'Iniciar sesión',
            yes: 'Sí',
            no: 'No',
            confirm: 'Confirmar',
        },
        chat: {
            newChat: 'Nuevo Chat',
            placeholder: 'Haz una pregunta...',
            send: 'Enviar',
            typing: 'Escribiendo...',
        },
        documents: {
            title: 'Documentos',
            upload: 'Subir documento',
            myDocuments: 'Mis documentos',
            recent: 'Recientes',
            shared: 'Compartidos',
            noDocuments: 'Sin documentos',
            analyzing: 'Analizando...',
            analysisComplete: 'Análisis completo',
        },
        settings: {
            title: 'Configuración',
            general: 'General',
            appearance: 'Apariencia',
            notifications: 'Notificaciones',
            privacy: 'Privacidad',
            language: 'Idioma',
            theme: 'Tema',
            themeLight: 'Claro',
            themeDark: 'Oscuro',
            themeSystem: 'Seguir sistema',
            autoSave: 'Guardado automático',
            autoSaveDesc: 'Guarda automáticamente tus documentos cada 30 segundos',
            voiceChat: 'Chat de voz',
            voiceChatDesc: 'Permite usar la funcionalidad de chat de voz',
            dataRetention: 'Período de retención de datos',
            emailNotifications: 'Notificaciones por correo',
            emailNotificationsDesc: 'Enviarme un correo cuando comience mi análisis',
            exclusiveContent: 'Contenido exclusivo',
            exclusiveContentDesc: 'Recibir ofertas exclusivas y actualizaciones',
        },
        assistant: {
            greeting: '¡Hola! Soy tu asistente de IA Justicia.',
            uploadPrompt: 'Sube un documento o hazme una pregunta para empezar.',
            analyzing: 'Analizando tu documento...',
            ready: 'Listo para responder tus preguntas',
        },
        errors: {
            generic: 'Ocurrió un error',
            uploadFailed: 'Error al subir',
            analysisFailed: 'Error en el análisis',
            saveFailed: 'Error al guardar',
            networkError: 'Error de red',
        },
    },
    de: {
        common: {
            welcome: 'Willkommen',
            loading: 'Laden...',
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            edit: 'Bearbeiten',
            close: 'Schließen',
            search: 'Suchen',
            upload: 'Hochladen',
            download: 'Herunterladen',
            share: 'Teilen',
            settings: 'Einstellungen',
            logout: 'Abmelden',
            login: 'Anmelden',
            yes: 'Ja',
            no: 'Nein',
            confirm: 'Bestätigen',
        },
        chat: {
            newChat: 'Neuer Chat',
            placeholder: 'Stelle eine Frage...',
            send: 'Senden',
            typing: 'Tippt...',
        },
        documents: {
            title: 'Dokumente',
            upload: 'Dokument hochladen',
            myDocuments: 'Meine Dokumente',
            recent: 'Kürzlich',
            shared: 'Geteilt',
            noDocuments: 'Keine Dokumente',
            analyzing: 'Analysiere...',
            analysisComplete: 'Analyse abgeschlossen',
        },
        settings: {
            title: 'Einstellungen',
            general: 'Allgemein',
            appearance: 'Aussehen',
            notifications: 'Benachrichtigungen',
            privacy: 'Datenschutz',
            language: 'Sprache',
            theme: 'Theme',
            themeLight: 'Hell',
            themeDark: 'Dunkel',
            themeSystem: 'System folgen',
            autoSave: 'Automatisches Speichern',
            autoSaveDesc: 'Speichert Ihre Dokumente automatisch alle 30 Sekunden',
            voiceChat: 'Sprach-Chat',
            voiceChatDesc: 'Aktiviert die Sprach-Chat-Funktion',
            dataRetention: 'Datenspeicherungsdauer',
            emailNotifications: 'E-Mail-Benachrichtigungen',
            emailNotificationsDesc: 'Senden Sie mir eine E-Mail, wenn meine Analyse beginnt',
            exclusiveContent: 'Exklusive Inhalte',
            exclusiveContentDesc: 'Exklusive Angebote und Updates erhalten',
        },
        assistant: {
            greeting: 'Hallo! Ich bin Ihr Justicia KI-Assistent.',
            uploadPrompt: 'Laden Sie ein Dokument hoch oder stellen Sie mir eine Frage, um zu beginnen.',
            analyzing: 'Analysiere Ihr Dokument...',
            ready: 'Bereit, Ihre Fragen zu beantworten',
        },
        errors: {
            generic: 'Ein Fehler ist aufgetreten',
            uploadFailed: 'Upload fehlgeschlagen',
            analysisFailed: 'Analyse fehlgeschlagen',
            saveFailed: 'Speichern fehlgeschlagen',
            networkError: 'Netzwerkfehler',
        },
    },
    it: {
        common: {
            welcome: 'Benvenuto',
            loading: 'Caricamento...',
            save: 'Salva',
            cancel: 'Annulla',
            delete: 'Elimina',
            edit: 'Modifica',
            close: 'Chiudi',
            search: 'Cerca',
            upload: 'Carica',
            download: 'Scarica',
            share: 'Condividi',
            settings: 'Impostazioni',
            logout: 'Disconnetti',
            login: 'Accedi',
            yes: 'Sì',
            no: 'No',
            confirm: 'Conferma',
        },
        chat: {
            newChat: 'Nuova Chat',
            placeholder: 'Fai una domanda...',
            send: 'Invia',
            typing: 'Sta scrivendo...',
        },
        documents: {
            title: 'Documenti',
            upload: 'Carica documento',
            myDocuments: 'I miei documenti',
            recent: 'Recenti',
            shared: 'Condivisi',
            noDocuments: 'Nessun documento',
            analyzing: 'Analizzando...',
            analysisComplete: 'Analisi completata',
        },
        settings: {
            title: 'Impostazioni',
            general: 'Generale',
            appearance: 'Aspetto',
            notifications: 'Notifiche',
            privacy: 'Privacy',
            language: 'Lingua',
            theme: 'Tema',
            themeLight: 'Chiaro',
            themeDark: 'Scuro',
            themeSystem: 'Segui sistema',
            autoSave: 'Salvataggio automatico',
            autoSaveDesc: 'Salva automaticamente i tuoi documenti ogni 30 secondi',
            voiceChat: 'Chat vocale',
            voiceChatDesc: 'Abilita la funzionalità di chat vocale',
            dataRetention: 'Periodo di conservazione dei dati',
            emailNotifications: 'Notifiche email',
            emailNotificationsDesc: 'Inviami un\'email quando inizia la mia analisi',
            exclusiveContent: 'Contenuti esclusivi',
            exclusiveContentDesc: 'Ricevi offerte esclusive e aggiornamenti',
        },
        assistant: {
            greeting: 'Ciao! Sono il tuo assistente IA Justicia.',
            uploadPrompt: 'Carica un documento o fammi una domanda per iniziare.',
            analyzing: 'Analizzo il tuo documento...',
            ready: 'Pronto a rispondere alle tue domande',
        },
        errors: {
            generic: 'Si è verificato un errore',
            uploadFailed: 'Caricamento fallito',
            analysisFailed: 'Analisi fallita',
            saveFailed: 'Salvataggio fallito',
            networkError: 'Errore di rete',
        },
    },
    pt: {
        common: {
            welcome: 'Bem-vindo',
            loading: 'Carregando...',
            save: 'Salvar',
            cancel: 'Cancelar',
            delete: 'Excluir',
            edit: 'Editar',
            close: 'Fechar',
            search: 'Pesquisar',
            upload: 'Carregar',
            download: 'Baixar',
            share: 'Compartilhar',
            settings: 'Configurações',
            logout: 'Sair',
            login: 'Entrar',
            yes: 'Sim',
            no: 'Não',
            confirm: 'Confirmar',
        },
        chat: {
            newChat: 'Novo Chat',
            placeholder: 'Faça uma pergunta...',
            send: 'Enviar',
            typing: 'Digitando...',
        },
        documents: {
            title: 'Documentos',
            upload: 'Carregar documento',
            myDocuments: 'Meus documentos',
            recent: 'Recentes',
            shared: 'Compartilhados',
            noDocuments: 'Sem documentos',
            analyzing: 'Analisando...',
            analysisComplete: 'Análise completa',
        },
        settings: {
            title: 'Configurações',
            general: 'Geral',
            appearance: 'Aparência',
            notifications: 'Notificações',
            privacy: 'Privacidade',
            language: 'Idioma',
            theme: 'Tema',
            themeLight: 'Claro',
            themeDark: 'Escuro',
            themeSystem: 'Seguir sistema',
            autoSave: 'Salvamento automático',
            autoSaveDesc: 'Salva automaticamente seus documentos a cada 30 segundos',
            voiceChat: 'Chat de voz',
            voiceChatDesc: 'Ativa a funcionalidade de chat de voz',
            dataRetention: 'Período de retenção de dados',
            emailNotifications: 'Notificações por email',
            emailNotificationsDesc: 'Envie-me um email quando minha análise começar',
            exclusiveContent: 'Conteúdo exclusivo',
            exclusiveContentDesc: 'Receba ofertas exclusivas e atualizações',
        },
        assistant: {
            greeting: 'Olá! Sou seu assistente de IA Justicia.',
            uploadPrompt: 'Carregue um documento ou faça uma pergunta para começar.',
            analyzing: 'Analisando seu documento...',
            ready: 'Pronto para responder suas perguntas',
        },
        errors: {
            generic: 'Ocorreu um erro',
            uploadFailed: 'Falha no carregamento',
            analysisFailed: 'Falha na análise',
            saveFailed: 'Falha ao salvar',
            networkError: 'Erro de rede',
        },
    },
};

class I18nService {
    private currentLanguage: Language = 'fr';
    private translations: Record<Language, Translations> = translations;

    /**
     * Définit la langue actuelle
     */
    setLanguage(language: Language) {
        this.currentLanguage = language;
        document.documentElement.lang = language;
    }

    /**
     * Récupère la langue actuelle
     */
    getLanguage(): Language {
        return this.currentLanguage;
    }

    /**
     * Traduit une clé
     * @param key Clé de traduction (ex: "common.welcome")
     * @param params Paramètres à remplacer dans la traduction
     */
    t(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key}`);
            return key;
        }

        // Remplacer les paramètres
        if (params) {
            return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param]?.toString() || match;
            });
        }

        return value;
    }

    /**
     * Vérifie si une traduction existe
     */
    has(key: string): boolean {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return false;
            }
        }

        return typeof value === 'string';
    }
}

// Instance singleton
export const i18n = new I18nService();

/**
 * Hook React pour l'i18n
 */
export function useTranslation() {
    const [language, setLanguage] = React.useState<Language>(i18n.getLanguage());

    const changeLanguage = (newLanguage: Language) => {
        i18n.setLanguage(newLanguage);
        setLanguage(newLanguage);
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        return i18n.t(key, params);
    };

    return {
        t,
        language,
        changeLanguage,
    };
}

// Import React pour le hook
import React from 'react';
