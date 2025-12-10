import React from 'react';

interface VoiceButtonProps {
    isRecording: boolean;
    onClick: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
    isRecording,
    onClick,
    disabled = false,
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${sizeClasses[size]}
                rounded-full
                flex items-center justify-center
                transition-all duration-200
                ${isRecording 
                    ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 animate-pulse shadow-lg shadow-purple-500/50' 
                    : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
                ${className}
            `}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Utiliser le mode vocal'}
        >
            {/* Icône micro (toujours) */}
            <svg
                className={`${iconSizes[size]} ${isRecording ? 'text-white' : 'text-gray-300'}`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                    fill="currentColor"
                />
                <path
                    d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                    fill="currentColor"
                />
            </svg>
        </button>
    );
};
