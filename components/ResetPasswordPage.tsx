import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'wouter';

const ResetPasswordPage: React.FC = () => {
    const [location] = useLocation();
    const [, navigate] = useNavigate();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Extraire le token de l'URL
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token manquant ou invalide');
        }
    }, [location]);

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

        if (!token) {
            setError('Token manquant');
            return;
        }

        if (passwordErrors.length > 0) {
            setError('Le mot de passe ne respecte pas les critères de sécurité');
            return;
        }

        if (!passwordsMatch) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la réinitialisation');
            }

            setSuccess(true);
            
            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la réinitialisation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Justicia</h1>
                    <p className="text-gray-400">Assistant Juridique IA</p>
                </div>

                {/* Card */}
                <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-neutral-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-600/20 rounded-lg">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Nouveau mot de passe</h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {success ? (
                            <div className="space-y-4">
                                {/* Success State */}
                                <div className="flex flex-col items-center text-center py-8">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Mot de passe modifié !</h3>
                                    <p className="text-gray-400 mb-6">
                                        Votre mot de passe a été réinitialisé avec succès.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Redirection vers la page de connexion...
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                        <p className="text-sm text-red-400">{error}</p>
                                    </div>
                                )}

                                {/* Description */}
                                <p className="text-gray-400 text-sm">
                                    Choisissez un nouveau mot de passe sécurisé pour votre compte.
                                </p>

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
                                            disabled={isLoading || !token}
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
                                        Confirmer le mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="••••••••"
                                            disabled={isLoading || !token}
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
                                        onClick={() => navigate('/')}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isLoading || !token || !newPassword || !confirmPassword || passwordErrors.length > 0 || !passwordsMatch}
                                    >
                                        {isLoading ? 'Modification...' : 'Réinitialiser'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-gray-500 text-sm">
                        © 2024 Justicia. Tous droits réservés.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
