import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useLocation, useNavigate } from 'wouter';

const VerifyEmailPage: React.FC = () => {
    const [location] = useLocation();
    const [, navigate] = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            // Extraire le token de l'URL
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setError('Token manquant ou invalide');
                setIsVerifying(false);
                return;
            }

            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erreur lors de la vérification');
                }

                setSuccess(true);
                
                // Rediriger vers l'application après 3 secondes
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (err: any) {
                setError(err.message || 'Erreur lors de la vérification');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyEmail();
    }, [location, navigate]);

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
                                <Mail className="w-6 h-6 text-purple-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Vérification de l'email</h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {isVerifying ? (
                            <div className="flex flex-col items-center text-center py-12">
                                <Loader className="w-12 h-12 text-purple-500 animate-spin mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Vérification en cours...</h3>
                                <p className="text-gray-400">
                                    Veuillez patienter pendant que nous vérifions votre email.
                                </p>
                            </div>
                        ) : success ? (
                            <div className="flex flex-col items-center text-center py-12">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Email vérifié !</h3>
                                <p className="text-gray-400 mb-6">
                                    Votre adresse email a été vérifiée avec succès.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Redirection vers l'application...
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center py-12">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Erreur de vérification</h3>
                                <p className="text-gray-400 mb-6">{error}</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    Retour à l'accueil
                                </button>
                            </div>
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

export default VerifyEmailPage;
