import { useState, useEffect } from 'react';

export interface AppSettings {
    language: string;
    theme: 'light' | 'dark' | 'system';
    receiveExclusiveContent: boolean;
    emailOnTaskStart: boolean;
    autoSaveDocuments: boolean;
    showAnalysisSummary: boolean;
    enableVoiceChat: boolean;
    dataRetention: number;
}

const DEFAULT_SETTINGS: AppSettings = {
    language: 'fr',
    theme: 'dark',
    receiveExclusiveContent: true,
    emailOnTaskStart: true,
    autoSaveDocuments: true,
    showAnalysisSummary: true,
    enableVoiceChat: true,
    dataRetention: 90
};

/**
 * Hook pour gérer les paramètres de l'application
 * Synchronise avec le backend via tRPC et applique les changements en temps réel
 */
export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(() => {
        // Charger depuis localStorage en attendant le backend
        const saved = localStorage.getItem('justiciaAppSettings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    const [isLoading, setIsLoading] = useState(false);

    // Appliquer le thème au chargement et lors des changements
    useEffect(() => {
        applyTheme(settings.theme);
    }, [settings.theme]);

    // Appliquer la langue au chargement et lors des changements
    useEffect(() => {
        applyLanguage(settings.language);
    }, [settings.language]);

    /**
     * Applique le thème à l'interface
     */
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
        const root = document.documentElement;
        
        if (theme === 'system') {
            // Suivre le thème du système
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.remove('light', 'dark');
            root.classList.add(systemTheme);
        } else {
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
        }

        // Mettre à jour les couleurs CSS personnalisées
        if (theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f5f5f5');
            root.style.setProperty('--text-primary', '#000000');
            root.style.setProperty('--text-secondary', '#666666');
        } else {
            root.style.setProperty('--bg-primary', '#0a0a0a');
            root.style.setProperty('--bg-secondary', '#171717');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a3a3a3');
        }
    };

    /**
     * Applique la langue à l'interface
     */
    const applyLanguage = (language: string) => {
        document.documentElement.lang = language;
        // TODO: Implémenter le système de traduction i18n
    };

    /**
     * Met à jour les paramètres
     */
    const updateSettings = async (newSettings: Partial<AppSettings>) => {
        setIsLoading(true);
        
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        
        // Sauvegarder dans localStorage immédiatement
        localStorage.setItem('justiciaAppSettings', JSON.stringify(updated));

        // TODO: Sauvegarder dans le backend via tRPC
        // try {
        //     await trpc.settings.update.mutate(updated);
        // } catch (error) {
        //     console.error('Erreur lors de la sauvegarde des paramètres:', error);
        // }

        setIsLoading(false);
    };

    /**
     * Charge les paramètres depuis le backend
     */
    const loadSettings = async () => {
        setIsLoading(true);
        
        // TODO: Charger depuis le backend via tRPC
        // try {
        //     const backendSettings = await trpc.settings.get.query();
        //     setSettings(backendSettings);
        //     localStorage.setItem('justiciaAppSettings', JSON.stringify(backendSettings));
        // } catch (error) {
        //     console.error('Erreur lors du chargement des paramètres:', error);
        // }

        setIsLoading(false);
    };

    /**
     * Réinitialise les paramètres par défaut
     */
    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem('justiciaAppSettings', JSON.stringify(DEFAULT_SETTINGS));
        // TODO: Réinitialiser dans le backend
    };

    return {
        settings,
        updateSettings,
        loadSettings,
        resetSettings,
        isLoading
    };
}

/**
 * Hook pour écouter les changements de thème système
 */
export function useSystemTheme() {
    const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    return systemTheme;
}
