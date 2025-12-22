import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface ChangePasswordModalProps {
    onClose: () => void;
    onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onChangePassword }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (password: string): string[] => {
        const errors: string[] = [];
        if (password.length < 8) {
            errors.push('Au moins 8 caractères');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Au moins une majuscule');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Au moins une minuscule');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Au moins un chiffre');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Au moins un caractère spécial');
        }
        return errors;
    };

    const passwordErrors = newPassword ? validatePassword(newPassword) : [];
    const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!oldPassword) {
            setError('Veuillez saisir votre mot de passe actuel');
            return;
        }

        if (passwordErrors.length > 0) {
            setError('Le nouveau mot de passe ne respecte pas les critères de sécurité');
            return;
        }

        if (!passwordsMatch) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            await onChangePassword(oldPassword, newPassword);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700">
                {/* Header */}
                <div className="p-6 border-b border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600/20 rounded-lg">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Changer le mot de passe</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Success Message */}
                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-400">Mot de passe modifié avec succès !</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Old Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Mot de passe actuel
                        </label>
                        <div className="relative">
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="••••••••"
                                disabled={isLoading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Nouveau mot de passe
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="••••••••"
                                disabled={isLoading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Password Requirements */}
                        {newPassword && (
                            <div className="mt-2 space-y-1">
                                {passwordErrors.map((err, index) => (
                                    <p key={index} className="text-xs text-red-400 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                        {err}
                                    </p>
                                ))}
                                {passwordErrors.length === 0 && (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Mot de passe sécurisé
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirmer le nouveau mot de passe
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="••••••••"
                                disabled={isLoading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {confirmPassword && (
                            <div className="mt-2">
                                {passwordsMatch ? (
                                    <p className="text-xs text-green-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Les mots de passe correspondent
                                    </p>
                                ) : (
                                    <p className="text-xs text-red-400 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
                            disabled={isLoading || success}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || success || !oldPassword || !newPassword || !confirmPassword || passwordErrors.length > 0 || !passwordsMatch}
                        >
                            {isLoading ? 'Modification...' : 'Modifier'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
