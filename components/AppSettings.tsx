import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AppSettingsProps {
    onClose: () => void;
    onUpdateSettings: (settings: AppSettings) => void;
    currentSettings: AppSettings;
}

export interface AppSettings {
    language: string;
    theme: 'light' | 'dark' | 'system';
    receiveExclusiveContent: boolean;
    emailOnTaskStart: boolean;
    autoSaveDocuments: boolean;
    showAnalysisSummary: boolean;
    enableVoiceChat: boolean;
    dataRetention: number; // jours
}

const AppSettingsComponent: React.FC<AppSettingsProps> = ({
    onClose,
    onUpdateSettings,
    currentSettings
}) => {
    const [settings, setSettings] = useState<AppSettings>(currentSettings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = (key: keyof AppSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdateSettings(settings);
        setHasChanges(false);
    };

    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'pt', name: 'Português' }
    ];

    const themes = [
        { value: 'light', label: 'Clair', icon: '☀️' },
        { value: 'dark', label: 'Sombre', icon: '🌙' },
        { value: 'system', label: 'Suivre le système', icon: '💻' }
    ];

    const retentionOptions = [
        { value: 30, label: '30 jours' },
        { value: 90, label: '90 jours' },
        { value: 180, label: '6 mois' },
        { value: 365, label: '1 an' },
        { value: -1, label: 'Indéfiniment' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* En-tête */}
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Paramètres</h2>
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Enregistrer
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-8">
                    {/* Général */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Général</h3>
                        
                        {/* Langue */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">Langue</label>
                            <select
                                value={settings.language}
                                onChange={(e) => handleChange('language', e.target.value)}
                                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Apparence */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Apparence</h3>
                        
                        <div className="grid grid-cols-3 gap-3">
                            {themes.map((theme) => (
                                <button
                                    key={theme.value}
                                    onClick={() => handleChange('theme', theme.value)}
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                        settings.theme === theme.value
                                            ? 'border-blue-500 bg-blue-500/10'
                                            : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                                    }`}
                                >
                                    <div className="text-3xl mb-2">{theme.icon}</div>
                                    <div className="text-sm font-medium text-white">{theme.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Personnalisation */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Personnalisation</h3>
                        
                        {/* Recevoir du contenu exclusif */}
                        <div className="flex items-start justify-between py-3">
                            <div className="flex-1 pr-4">
                                <div className="text-sm font-medium text-white mb-1">
                                    Recevoir du contenu exclusif
                                </div>
                                <div className="text-xs text-gray-400">
                                    Obtenez des offres exclusives, des mises à jour d'événements, d'excellents exemples de cas et des guides des nouvelles fonctionnalités.
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('receiveExclusiveContent', !settings.receiveExclusiveContent)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.receiveExclusiveContent ? 'bg-blue-600' : 'bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.receiveExclusiveContent ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Email lors du démarrage de tâche */}
                        <div className="flex items-start justify-between py-3">
                            <div className="flex-1 pr-4">
                                <div className="text-sm font-medium text-white mb-1">
                                    Envoyez-moi un email lorsque mon analyse commence à être traitée
                                </div>
                                <div className="text-xs text-gray-400">
                                    Lorsque cette option est activée, nous vous enverrons un email dès que votre analyse aura fini de se mettre en file d'attente et commencera à être traitée, afin que vous puissiez facilement vérifier sa progression.
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('emailOnTaskStart', !settings.emailOnTaskStart)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.emailOnTaskStart ? 'bg-blue-600' : 'bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.emailOnTaskStart ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Sauvegarde automatique */}
                        <div className="flex items-start justify-between py-3">
                            <div className="flex-1 pr-4">
                                <div className="text-sm font-medium text-white mb-1">
                                    Sauvegarde automatique des documents
                                </div>
                                <div className="text-xs text-gray-400">
                                    Enregistre automatiquement vos documents et analyses toutes les 30 secondes.
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('autoSaveDocuments', !settings.autoSaveDocuments)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.autoSaveDocuments ? 'bg-blue-600' : 'bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.autoSaveDocuments ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Afficher le résumé d'analyse */}
                        <div className="flex items-start justify-between py-3">
                            <div className="flex-1 pr-4">
                                <div className="text-sm font-medium text-white mb-1">
                                    Afficher le résumé d'analyse automatiquement
                                </div>
                                <div className="text-xs text-gray-400">
                                    Affiche automatiquement le résumé de l'analyse après l'upload d'un document.
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('showAnalysisSummary', !settings.showAnalysisSummary)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.showAnalysisSummary ? 'bg-blue-600' : 'bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.showAnalysisSummary ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Chat vocal activé */}
                        <div className="flex items-start justify-between py-3">
                            <div className="flex-1 pr-4">
                                <div className="text-sm font-medium text-white mb-1">
                                    Activer le chat vocal
                                </div>
                                <div className="text-xs text-gray-400">
                                    Permet d'utiliser la fonctionnalité de chat vocal avec l'assistant Justicia.
                                </div>
                            </div>
                            <button
                                onClick={() => handleChange('enableVoiceChat', !settings.enableVoiceChat)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.enableVoiceChat ? 'bg-blue-600' : 'bg-neutral-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.enableVoiceChat ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Données et confidentialité */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Données et confidentialité</h3>
                        
                        {/* Durée de conservation */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                                Durée de conservation des données
                            </label>
                            <select
                                value={settings.dataRetention}
                                onChange={(e) => handleChange('dataRetention', parseInt(e.target.value))}
                                className="w-full px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {retentionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400">
                                Les documents et analyses seront automatiquement supprimés après cette période.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppSettingsComponent;
