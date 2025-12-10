import React, { useState } from 'react';
import { JusticiaLogo } from '../constants';
import { User } from '../types';
import { signIn, signUp } from '../services/firebaseService';

interface LoginPageProps {
    onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        try {
            let user: User;
            
            if (isSignUp) {
                user = await signUp(email, password);
            } else {
                user = await signIn(email, password);
            }
            
            onLogin(user);
        } catch (error: any) {
            setError(error.message || 'Authentication failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-transparent text-gray-300 p-4">
            <div className="w-full max-w-sm sm:max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl glass-pane">
                <div className="text-center">
                    <div className="inline-block mb-4 sm:mb-6">
                       <JusticiaLogo showText={true} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{isSignUp ? 'Créer un Compte' : 'Bon Retour'}</h1>
                    <p className="text-sm sm:text-base text-gray-400 mt-2">{isSignUp ? 'Inscrivez-vous pour commencer à utiliser Justicia' : 'Connectez-vous pour continuer sur Justicia'}</p>
                </div>
                <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-400">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 block w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-justicia-purple focus:border-justicia-gradient transition text-sm sm:text-base"
                            placeholder="your.email@example.com"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                             <label htmlFor="password" className="text-sm font-medium text-gray-400">Mot de passe</label>
                             {!isSignUp && <a href="#" className="text-xs sm:text-sm text-justicia-gradient hover:underline">Mot de passe oublié ?</a>}
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 block w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-justicia-purple focus:border-justicia-gradient transition text-sm sm:text-base"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-justicia-gradient hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-justicia-purple transition-all duration-300 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {isSignUp ? 'Création du compte...' : 'Connexion...'}
                                </span>
                            ) : (
                                isSignUp ? 'S\'inscrire' : 'Se connecter'
                            )}
                        </button>
                    </div>
                </form>
                <p className="text-center text-xs sm:text-sm text-gray-400">
                    {isSignUp ? (
                        <>
                            Already have an account?{' '}
                            <button type="button" className="font-medium text-justicia-gradient hover:underline" onClick={() => setIsSignUp(false)}>
                                Sign in
                            </button>
                        </>
                    ) : (
                        <>
                            Don't have an account?{' '}
                            <button type="button" className="font-medium text-justicia-gradient hover:underline" onClick={() => setIsSignUp(true)}>
                                Sign up
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
