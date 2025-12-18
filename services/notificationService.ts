/**
 * Service de notifications
 * Gère les notifications push du navigateur et les notifications par email
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
    title: string;
    body: string;
    type?: NotificationType;
    icon?: string;
    onClick?: () => void;
    duration?: number; // Durée d'affichage en ms (0 = permanent)
}

class NotificationService {
    private permission: NotificationPermission = 'default';
    private notificationQueue: NotificationOptions[] = [];

    constructor() {
        // Vérifier la permission au démarrage
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    /**
     * Demande la permission pour les notifications
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Ce navigateur ne supporte pas les notifications');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                // Envoyer les notifications en attente
                this.processQueue();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error);
            return false;
        }
    }

    /**
     * Affiche une notification dans le navigateur
     */
    async show(options: NotificationOptions) {
        // Afficher d'abord une notification toast dans l'interface
        this.showToast(options);

        // Si les notifications push ne sont pas autorisées, s'arrêter ici
        if (this.permission !== 'granted') {
            this.notificationQueue.push(options);
            return;
        }

        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon || '/logo.png',
                badge: '/logo.png',
                tag: `justicia-${Date.now()}`,
                requireInteraction: options.duration === 0,
            });

            if (options.onClick) {
                notification.onclick = () => {
                    window.focus();
                    options.onClick?.();
                    notification.close();
                };
            }

            // Fermer automatiquement après la durée spécifiée
            if (options.duration && options.duration > 0) {
                setTimeout(() => {
                    notification.close();
                }, options.duration);
            }
        } catch (error) {
            console.error('Erreur lors de l\'affichage de la notification:', error);
        }
    }

    /**
     * Affiche une notification toast dans l'interface
     */
    private showToast(options: NotificationOptions) {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        // Couleur selon le type
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: 'bg-blue-600 text-white'
        };
        
        toast.className += ` ${colors[options.type || 'info']}`;

        // Icône selon le type
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="text-2xl">${icons[options.type || 'info']}</div>
                <div class="flex-1">
                    <div class="font-semibold mb-1">${options.title}</div>
                    <div class="text-sm opacity-90">${options.body}</div>
                </div>
                <button class="text-white hover:opacity-75 transition-opacity" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(toast);

        // Animer l'apparition
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Ajouter le clic si spécifié
        if (options.onClick) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', (e) => {
                if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                    options.onClick?.();
                    toast.remove();
                }
            });
        }

        // Supprimer après la durée spécifiée (défaut: 5 secondes)
        const duration = options.duration !== undefined ? options.duration : 5000;
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, duration);
        }
    }

    /**
     * Traite la file d'attente des notifications
     */
    private processQueue() {
        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            if (notification) {
                this.show(notification);
            }
        }
    }

    /**
     * Notifications prédéfinies
     */
    success(title: string, body: string) {
        this.show({ title, body, type: 'success' });
    }

    error(title: string, body: string) {
        this.show({ title, body, type: 'error' });
    }

    warning(title: string, body: string) {
        this.show({ title, body, type: 'warning' });
    }

    info(title: string, body: string) {
        this.show({ title, body, type: 'info' });
    }

    /**
     * Notification pour le démarrage d'une analyse
     */
    analysisStarted(documentName: string) {
        this.info(
            'Analyse démarrée',
            `L'analyse du document "${documentName}" a commencé.`
        );
    }

    /**
     * Notification pour la fin d'une analyse
     */
    analysisCompleted(documentName: string) {
        this.success(
            'Analyse terminée',
            `L'analyse du document "${documentName}" est terminée.`
        );
    }

    /**
     * Notification pour une erreur d'analyse
     */
    analysisError(documentName: string, error: string) {
        this.error(
            'Erreur d\'analyse',
            `Erreur lors de l'analyse de "${documentName}": ${error}`
        );
    }

    /**
     * Notification pour la sauvegarde automatique
     */
    autoSaved() {
        this.success(
            'Sauvegarde automatique',
            'Vos modifications ont été sauvegardées automatiquement.',
        );
    }

    /**
     * Envoie une notification par email (via backend)
     */
    async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
        try {
            // TODO: Appeler l'API backend pour envoyer l'email
            // const response = await fetch('/api/notifications/email', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ to, subject, body })
            // });
            // return response.ok;
            
            console.log('Email à envoyer:', { to, subject, body });
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
            return false;
        }
    }
}

// Instance singleton
export const notificationService = new NotificationService();

/**
 * Hook React pour les notifications
 */
export function useNotifications() {
    const [hasPermission, setHasPermission] = React.useState(
        notificationService['permission'] === 'granted'
    );

    const requestPermission = async () => {
        const granted = await notificationService.requestPermission();
        setHasPermission(granted);
        return granted;
    };

    return {
        hasPermission,
        requestPermission,
        show: notificationService.show.bind(notificationService),
        success: notificationService.success.bind(notificationService),
        error: notificationService.error.bind(notificationService),
        warning: notificationService.warning.bind(notificationService),
        info: notificationService.info.bind(notificationService),
    };
}

// Import React pour le hook
import React from 'react';
