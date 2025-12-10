import React from 'react';

interface JusticiaLoaderProps {
    size?: 'small' | 'medium' | 'large' | 'default';
    text?: string;
    className?: string;
}

const JusticiaLoader: React.FC<JusticiaLoaderProps> = ({ 
    size = 'default', 
    text = 'Chargement en cours...', 
    className = '' 
}) => {
    const sizeClasses = {
        small: 'w-10 h-10',
        medium: 'w-16 h-16',
        default: 'w-20 h-20',
        large: 'w-24 h-24'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`${sizeClasses[size]} justicia-loader`}>
                <img 
                    src="/justicia_loader_perfect.gif" 
                    alt="Loading..." 
                    className="w-full h-full"
                />
            </div>
            {text && (
                <div className="mt-4 text-sm text-neutral-400 animate-pulse">
                    {text}
                </div>
            )}
        </div>
    );
};

export default JusticiaLoader;
