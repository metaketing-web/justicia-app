import React, { useState } from 'react';
import { X, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

interface ForgotPasswordModalProps {
    onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Veuillez saisir votre adresse email');
            return;
        }

        if (!validateEmail(email)) {
            setError('Adresse email invalide');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'envoi de l\'email');
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
                                <Mail className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Mot de passe oublié</h2>
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
                <div className="p-6">
                    {success ? (
                        <div className="space-y-4">
                            {/* Success State */}
                            <div className="flex flex-col items-center text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Email envoyé !</h3>
                                <p className="text-gray-400 mb-6">
                                    Nous avons envoyé un lien de réinitialisation à <strong className="text-white">{email}</strong>
                                </p>
                                <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-left">
                                    <p className="text-sm text-blue-400">
                                        <strong>📧 Vérifiez votre boîte mail</strong><br />
                                        Le lien expire dans <strong>1 heure</strong>. Si vous ne voyez pas l'email, vérifiez vos spams.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSuccess(false)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Renvoyer
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Fermer
                                </button>
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
                                Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                            </p>

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Adresse email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="votre@email.com"
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
                                    disabled={isLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading || !email}
                                >
                                    {isLoading ? 'Envoi...' : 'Envoyer le lien'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
