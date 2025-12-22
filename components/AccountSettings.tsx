import React, { useState } from 'react';
import { X, Upload, Copy, Check, Save } from 'lucide-react';
import { User } from '../types';
import ChangePasswordModal from './ChangePasswordModal';

interface AccountSettingsProps {
    user: User;
    onClose: () => void;
    onUpdateProfile: (updates: Partial<User>) => void;
    onDeleteAccount: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
    user,
    onClose,
    onUpdateProfile,
    onDeleteAccount
}) => {
    const [name, setName] = useState(user.name || user.username || '');
    const [username, setUsername] = useState(user.username || '');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copiedUserId, setCopiedUserId] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl || '');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSaveName = () => {
        setIsEditingName(false);
        setHasUnsavedChanges(true);
    };

    const handleSaveUsername = () => {
        setIsEditingUsername(false);
        setHasUnsavedChanges(true);
    };

    const handleSaveAllChanges = async () => {
        setIsSaving(true);
        
        const updates: Partial<User> = {};
        
        if (name && name.trim() && name.trim() !== (user.name || user.username)) {
            updates.name = name.trim();
            updates.username = name.trim(); // Synchroniser username avec name
        }
        
        if (username && username.trim() && username.trim() !== user.username) {
            updates.username = username.trim();
        }
        
        if (avatarPreview && avatarPreview !== user.avatarUrl) {
            updates.avatarUrl = avatarPreview;
        }
        
        if (Object.keys(updates).length > 0) {
            onUpdateProfile(updates);
        }
        
        // Simuler un délai de sauvegarde
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setHasUnsavedChanges(false);
        setIsSaving(false);
    };

    const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier que c'est une image
            if (!file.type.startsWith('image/')) {
                alert('Veuillez sélectionner une image');
                return;
            }
            
            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('L\'image ne doit pas dépasser 5 MB');
                return;
            }
            
            // Créer une URL de prévisualisation
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setAvatarPreview(dataUrl);
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyUserId = () => {
        navigator.clipboard.writeText(user.id);
        setCopiedUserId(true);
        setTimeout(() => setCopiedUserId(false), 2000);
    };

    const handleDeleteAccount = () => {
        if (showDeleteConfirm) {
            onDeleteAccount();
        } else {
            setShowDeleteConfirm(true);
            setTimeout(() => setShowDeleteConfirm(false), 5000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* En-tête */}
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Profil</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-6 space-y-8">
                    {/* Photo de profil */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">Photo de profil</label>
                        <div className="flex items-center gap-4">
                            <img
                                src={avatarPreview || user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                alt={username}
                                className="w-20 h-20 rounded-full object-cover border-2 border-neutral-700"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Changer la photo</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">Format : JPG, PNG, GIF (max 5 MB)</p>
                    </div>

                    {/* Nom d'utilisateur */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Nom d'utilisateur</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    setHasUnsavedChanges(true);
                                }}
                                onFocus={() => setIsEditingUsername(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveUsername();
                                    if (e.key === 'Escape') {
                                        setUsername(user.username);
                                        setIsEditingUsername(false);
                                    }
                                }}
                                className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Votre nom d'utilisateur"
                            />

                        </div>
                    </div>

                    {/* Nom complet */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Nom complet</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setHasUnsavedChanges(true);
                                }}
                                onFocus={() => setIsEditingName(true)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveName();
                                    if (e.key === 'Escape') {
                                        setName(user.name);
                                        setIsEditingName(false);
                                    }
                                }}
                                className="flex-1 px-4 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Votre nom complet"
                            />

                        </div>
                    </div>

                    {/* E-mail */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">E-mail</label>
                        <div className="px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-gray-400">
                            {user.email}
                        </div>
                        <p className="text-xs text-gray-500">L'e-mail ne peut pas être modifié</p>
                    </div>

                    {/* ID utilisateur */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">ID utilisateur</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-gray-400 font-mono text-sm">
                                {user.id}
                            </div>
                            <button
                                onClick={handleCopyUserId}
                                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
                                title="Copier l'ID"
                            >
                                {copiedUserId ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mot de passe */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Mot de passe</label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-4 py-2.5 bg-neutral-800/50 border border-neutral-700 rounded-lg text-gray-400">
                                ••••••••••
                            </div>
                            <button 
                                onClick={() => setShowChangePassword(true)}
                                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                Mettre à jour le mot de passe
                            </button>
                        </div>
                    </div>

                    {/* Bouton de sauvegarde */}
                    <div className="pt-6 border-t border-neutral-800">
                        <button
                            onClick={handleSaveAllChanges}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 ${
                                hasUnsavedChanges && !isSaving
                                    ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-neutral-800 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Sauvegarde en cours...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    <span>{hasUnsavedChanges ? 'Sauvegarder les modifications' : 'Aucune modification à sauvegarder'}</span>
                                </>
                            )}
                        </button>
                        {hasUnsavedChanges && !isSaving && (
                            <p className="text-xs text-purple-400 mt-2 text-center">
                                ⚠️ Vous avez des modifications non sauvegardées
                            </p>
                        )}
                    </div>

                    {/* Supprimer le compte */}
                    <div className="pt-6 border-t border-neutral-800 space-y-3 mt-6">
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-1">Supprimer le compte</h3>
                            <p className="text-xs text-gray-400">
                                Cela supprimera votre compte et toutes les données.
                            </p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className={`px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                                showDeleteConfirm
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-transparent hover:bg-red-500/10 text-red-500 border border-red-500/30'
                            }`}
                        >
                            {showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer le compte'}
                        </button>
                        {showDeleteConfirm && (
                            <p className="text-xs text-red-400">
                                Cliquez à nouveau pour confirmer la suppression définitive
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showChangePassword && (
                <ChangePasswordModal
                    onClose={() => setShowChangePassword(false)}
                    onChangePassword={async (oldPassword, newPassword) => {
                        // TODO: Implémenter l'appel API pour changer le mot de passe
                        // Pour l'instant, on simule un succès
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        console.log('Password change requested:', { oldPassword: '***', newPassword: '***' });
                    }}
                />
            )}
        </div>
    );
};

export default AccountSettings;
