import React, { useState } from 'react';
import { User } from '../types';
import { 
    User as UserIcon, 
    Settings, 
    Home, 
    HelpCircle, 
    LogOut,
    Lightbulb,
    ChevronRight,
    RefreshCw,
    AudioLines,
    FileText,
    Edit3,
    Database
} from 'lucide-react';

interface UserMenuProps {
    user: User;
    onLogout: () => void;
    onShowVoiceChat?: () => void;
    onShowReportGenerator?: () => void;
    onShowDocumentEditor?: () => void;
    onShowRAGSpace?: () => void;
    onShowAccount?: () => void;
    onShowSettings?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
    user,
    onLogout,
    onShowVoiceChat,
    onShowReportGenerator,
    onShowDocumentEditor,
    onShowRAGSpace,
    onShowAccount,
    onShowSettings
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        {
            icon: Lightbulb,
            label: 'Connaissance',
            onClick: onShowRAGSpace,
            visible: !!onShowRAGSpace
        },
        {
            icon: UserIcon,
            label: 'Compte',
            onClick: onShowAccount,
            visible: !!onShowAccount
        },
        {
            icon: Settings,
            label: 'Paramètres',
            onClick: onShowSettings,
            visible: !!onShowSettings
        },
        {
            icon: HelpCircle,
            label: "Obtenir de l'aide",
            onClick: () => window.open('https://justicia.ci', '_blank'),
            external: true,
            visible: true
        }
    ];

    return (
        <div className="relative">
            {/* Bouton utilisateur */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800/50 transition-colors"
            >
                <div className="relative">
                    <img
                        src={user.avatarUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.username}</p>
                    <p className="text-xs text-gray-400 truncate">Justicia</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Menu déroulant */}
            {isOpen && (
                <>
                    {/* Overlay pour fermer le menu */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Menu */}
                    <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">
                        {/* En-tête du profil */}
                        <div className="p-4 border-b border-neutral-800">
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    <img
                                        src={user.avatarUrl || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                        alt={user.username}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-neutral-900 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                </div>
                                <button className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors">
                                    <RefreshCw className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>


                        </div>

                        {/* Menu principal */}
                        <div className="py-2">
                            {menuItems.filter(item => item.visible).map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick?.();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800/50 transition-colors text-left"
                                >
                                    <item.icon className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1 text-sm text-white">{item.label}</span>
                                    {item.external && (
                                        <ChevronRight className="w-4 h-4 text-gray-400 -rotate-45" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Déconnexion */}
                        <div className="border-t border-neutral-800 py-2">
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left"
                            >
                                <LogOut className="w-5 h-5 text-red-500" />
                                <span className="text-sm text-red-500 font-medium">Se déconnecter</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserMenu;
