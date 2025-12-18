import { useState } from 'react';
import { generateWordDocument } from '../services/wordDocumentService';

interface UseWordDownloadOptions {
  headerType?: 'justicia' | 'porteo';
}

export function useWordDownload(options: UseWordDownloadOptions = {}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadWord = async (title: string, content: string, customHeaderType?: 'justicia' | 'porteo') => {
    setIsDownloading(true);
    setError(null);
    
    try {
      const blob = await generateWordDocument({
        title,
        content,
        headerType: customHeaderType || options.headerType || 'justicia',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return true;
    } catch (err: any) {
      console.error('[useWordDownload] Error:', err);
      setError(err.message || 'Erreur lors du téléchargement');
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadWord,
    isDownloading,
    error,
  };
}
