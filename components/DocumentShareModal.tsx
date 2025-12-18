import React, { useState } from 'react';
import { X, Share2, Users, Check, Loader2, AlertCircle } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface DocumentShareModalProps {
  documentId: number;
  documentTitle: string;
  onClose: () => void;
}

type Permission = 'read' | 'write' | 'admin';

const DocumentShareModal: React.FC<DocumentShareModalProps> = ({ documentId, documentTitle, onClose }) => {
  const [userEmail, setUserEmail] = useState('');
  const [selectedPermission, setSelectedPermission] = useState<Permission>('read');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async () => {
    if (!userEmail.trim()) {
      setError('Veuillez entrer un email');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(false);

    try {
      await trpc.permissions.share.mutate({
        documentId,
        userEmail: userEmail.trim(),
        permission: selectedPermission,
      });

      setSuccess(true);
      setUserEmail('');
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('[DocumentShareModal] Error:', err);
      setError(err.message || 'Erreur lors du partage');
    } finally {
      setIsSharing(false);
    }
  };

  const permissions: { value: Permission; label: string; description: string }[] = [
    {
      value: 'read',
      label: 'Lecture seule',
      description: 'Peut uniquement consulter le document',
    },
    {
      value: 'write',
      label: 'Lecture et écriture',
      description: 'Peut consulter et modifier le document',
    },
    {
      value: 'admin',
      label: 'Administrateur',
      description: 'Peut consulter, modifier et partager le document',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md border border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Share2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Partager le document</h2>
              <p className="text-sm text-gray-400 mt-0.5">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email de l'utilisateur
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleShare()}
              placeholder="exemple@email.com"
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Niveau de permission
            </label>
            <div className="space-y-2">
              {permissions.map((perm) => (
                <button
                  key={perm.value}
                  onClick={() => setSelectedPermission(perm.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPermission === perm.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{perm.label}</span>
                        {selectedPermission === perm.value && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{perm.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">Document partagé avec succès !</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing || !userEmail.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Partage...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Partager
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentShareModal;
