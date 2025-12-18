import React, { useState } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { useRealtimeVoiceSimple } from '../hooks/useRealtimeVoiceSimple';

export interface RealtimeVoiceButtonSimpleProps {
  getCurrentContent: () => string;
  updateContent: (newContent: string) => void;
  className?: string;
}

export const RealtimeVoiceButtonSimple: React.FC<RealtimeVoiceButtonSimpleProps> = ({
  getCurrentContent,
  updateContent,
  className = ''
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  // Récupérer la clé API depuis les variables d'environnement ou le localStorage
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';

  const {
    isConnected,
    isConnecting,
    error,
    transcript,
    connect,
    disconnect
  } = useRealtimeVoiceSimple(apiKey, {
    getCurrentContent,
    updateContent
  });

  const handleToggle = async () => {
    if (isConnected) {
      disconnect();
    } else {
      if (!apiKey) {
        alert('Veuillez configurer votre clé API OpenAI dans les paramètres');
        return;
      }
      await connect();
    }
  };

  return (
    <div className={`realtime-voice-container ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isConnecting}
        className={`realtime-voice-button ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
        title={isConnected ? 'Arrêter la conversation vocale' : 'Démarrer la conversation vocale'}
        style={{
          padding: '10px 15px',
          borderRadius: '8px',
          border: 'none',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          backgroundColor: isConnected ? '#ef4444' : '#3b82f6',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        {isConnecting ? (
          <>
            <Loader size={18} className="animate-spin" />
            <span>Connexion...</span>
          </>
        ) : isConnected ? (
          <>
            <MicOff size={18} />
            <span>Arrêter</span>
          </>
        ) : (
          <>
            <Mic size={18} />
            <span>Parler avec Justicia</span>
          </>
        )}
      </button>

      {error && (
        <div className="realtime-voice-error" style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '6px',
          fontSize: '13px'
        }}>
          Erreur : {error}
        </div>
      )}

      {isConnected && (
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {showTranscript ? 'Masquer' : 'Afficher'} la transcription
          </button>

          {showTranscript && transcript.length > 0 && (
            <div className="realtime-voice-transcript" style={{
              marginTop: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              {transcript.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '8px',
                    padding: '8px',
                    backgroundColor: entry.role === 'user' ? '#dbeafe' : '#fef3c7',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  <strong style={{ color: entry.role === 'user' ? '#1e40af' : '#92400e' }}>
                    {entry.role === 'user' ? 'Vous' : 'Justicia'}:
                  </strong>
                  <span style={{ marginLeft: '8px' }}>{entry.text}</span>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                    {entry.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          backgroundColor: '#d1fae5',
          color: '#065f46',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          🎤 Conversation active - Parlez naturellement pour modifier le document
        </div>
      )}
    </div>
  );
};

export default RealtimeVoiceButtonSimple;
