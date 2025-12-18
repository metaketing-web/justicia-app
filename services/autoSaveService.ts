/**
 * Service d'auto-sauvegarde des documents
 * Sauvegarde automatiquement les modifications toutes les 30 secondes
 */

interface AutoSaveOptions {
    interval?: number; // Intervalle en millisecondes (défaut: 30000 = 30 secondes)
    onSave: (content: any) => Promise<void>;
    onError?: (error: Error) => void;
}

class AutoSaveService {
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private pendingChanges: Map<string, any> = new Map();
    private isSaving: Map<string, boolean> = new Map();

    /**
     * Démarre l'auto-save pour un document
     */
    start(documentId: string, options: AutoSaveOptions) {
        const interval = options.interval || 30000; // 30 secondes par défaut

        // Arrêter l'ancien timer s'il existe
        this.stop(documentId);

        // Créer un nouveau timer
        const timer = setInterval(async () => {
            await this.saveIfNeeded(documentId, options);
        }, interval);

        this.timers.set(documentId, timer);
    }

    /**
     * Arrête l'auto-save pour un document
     */
    stop(documentId: string) {
        const timer = this.timers.get(documentId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(documentId);
        }
        this.pendingChanges.delete(documentId);
        this.isSaving.delete(documentId);
    }

    /**
     * Marque un document comme ayant des modifications en attente
     */
    markDirty(documentId: string, content: any) {
        this.pendingChanges.set(documentId, content);
    }

    /**
     * Sauvegarde immédiatement un document
     */
    async saveNow(documentId: string, options: AutoSaveOptions) {
        const content = this.pendingChanges.get(documentId);
        if (!content) return;

        await this.save(documentId, content, options);
    }

    /**
     * Sauvegarde si des modifications sont en attente
     */
    private async saveIfNeeded(documentId: string, options: AutoSaveOptions) {
        const content = this.pendingChanges.get(documentId);
        if (!content) return;

        // Ne pas sauvegarder si une sauvegarde est déjà en cours
        if (this.isSaving.get(documentId)) return;

        await this.save(documentId, content, options);
    }

    /**
     * Effectue la sauvegarde
     */
    private async save(documentId: string, content: any, options: AutoSaveOptions) {
        this.isSaving.set(documentId, true);

        try {
            await options.onSave(content);
            this.pendingChanges.delete(documentId);
            
            // Afficher un indicateur visuel de sauvegarde réussie
            this.showSaveIndicator('success');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde automatique:', error);
            if (options.onError) {
                options.onError(error as Error);
            }
            this.showSaveIndicator('error');
        } finally {
            this.isSaving.set(documentId, false);
        }
    }

    /**
     * Affiche un indicateur visuel de sauvegarde
     */
    private showSaveIndicator(status: 'success' | 'error') {
        // Créer un élément d'indicateur
        const indicator = document.createElement('div');
        indicator.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 transition-opacity duration-300`;
        
        if (status === 'success') {
            indicator.className += ' bg-green-600';
            indicator.textContent = '✓ Sauvegardé automatiquement';
        } else {
            indicator.className += ' bg-red-600';
            indicator.textContent = '✗ Erreur de sauvegarde';
        }

        document.body.appendChild(indicator);

        // Animer l'apparition
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);

        // Supprimer après 3 secondes
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(indicator);
            }, 300);
        }, 3000);
    }

    /**
     * Vérifie si un document a des modifications en attente
     */
    hasPendingChanges(documentId: string): boolean {
        return this.pendingChanges.has(documentId);
    }

    /**
     * Arrête tous les timers d'auto-save
     */
    stopAll() {
        this.timers.forEach((timer) => clearInterval(timer));
        this.timers.clear();
        this.pendingChanges.clear();
        this.isSaving.clear();
    }
}

// Instance singleton
export const autoSaveService = new AutoSaveService();

/**
 * Hook React pour l'auto-save
 */
export function useAutoSave(
    documentId: string,
    content: any,
    onSave: (content: any) => Promise<void>,
    enabled: boolean = true
) {
    const [isSaving, setIsSaving] = React.useState(false);
    const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

    React.useEffect(() => {
        if (!enabled) return;

        autoSaveService.start(documentId, {
            onSave: async (content) => {
                setIsSaving(true);
                await onSave(content);
                setIsSaving(false);
                setLastSaved(new Date());
            },
            onError: (error) => {
                console.error('Erreur auto-save:', error);
                setIsSaving(false);
            }
        });

        return () => {
            autoSaveService.stop(documentId);
        };
    }, [documentId, enabled]);

    // Marquer comme modifié quand le contenu change
    React.useEffect(() => {
        if (enabled && content) {
            autoSaveService.markDirty(documentId, content);
        }
    }, [documentId, content, enabled]);

    const saveNow = async () => {
        await autoSaveService.saveNow(documentId, {
            onSave: async (content) => {
                setIsSaving(true);
                await onSave(content);
                setIsSaving(false);
                setLastSaved(new Date());
            }
        });
    };

    return {
        isSaving,
        lastSaved,
        saveNow
    };
}

// Import React pour le hook
import React from 'react';
