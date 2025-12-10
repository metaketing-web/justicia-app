/**
 * Service OCR utilisant GPT-4 Vision pour extraire le texte des images et documents scannés
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Convertit un fichier en base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Détecte si un PDF contient du texte sélectionnable ou s'il est scanné
 */
export async function isPDFScanned(file: File): Promise<boolean> {
  try {
    // Essayer d'extraire du texte avec pdfjs
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    
    // Si le PDF contient très peu de texte par rapport à sa taille, c'est probablement un scan
    const textDensity = text.length / file.size;
    return textDensity < 0.01; // Seuil arbitraire
  } catch (error) {
    console.error('[OCR] Erreur lors de la détection du type de PDF:', error);
    return false;
  }
}

/**
 * Extrait le texte d'une image ou d'un document scanné avec GPT-4 Vision
 */
export async function extractTextWithVision(
  file: File,
  documentType: 'legal' | 'contract' | 'general' = 'general'
): Promise<string> {
  try {
    console.log(`[OCR] Extraction du texte avec GPT-4 Vision pour: ${file.name}`);

    // Convertir le fichier en base64
    const base64Image = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    // Préparer le prompt selon le type de document
    let systemPrompt = '';
    let userPrompt = '';

    switch (documentType) {
      case 'legal':
        systemPrompt = 'Tu es un expert en extraction de texte juridique. Extrais tout le texte de ce document juridique en préservant la structure (titres, articles, paragraphes).';
        userPrompt = `Extrais tout le texte de ce document juridique en format Markdown structuré.

Instructions:
- Préserve la hiérarchie (Titres, Chapitres, Articles)
- Utilise ## pour les titres principaux, ### pour les sous-titres
- Numérote correctement les articles
- Préserve les listes et énumérations
- Ignore les en-têtes et pieds de page répétitifs
- Retourne UNIQUEMENT le texte extrait, sans commentaires`;
        break;

      case 'contract':
        systemPrompt = 'Tu es un expert en extraction de texte contractuel. Extrais tout le texte de ce contrat en préservant la structure et les clauses.';
        userPrompt = `Extrais tout le texte de ce contrat en format Markdown structuré.

Instructions:
- Identifie les parties (Client, Prestataire, etc.)
- Numérote les articles et clauses
- Préserve les conditions et obligations
- Identifie les signatures et dates
- Retourne UNIQUEMENT le texte extrait, sans commentaires`;
        break;

      default:
        systemPrompt = 'Tu es un expert en extraction de texte. Extrais tout le texte de ce document en préservant la structure.';
        userPrompt = `Extrais tout le texte de ce document en format Markdown.

Instructions:
- Préserve la structure (titres, paragraphes, listes)
- Ignore les éléments décoratifs
- Retourne UNIQUEMENT le texte extrait, sans commentaires`;
    }

    // Appeler l'API OpenAI GPT-4 Vision
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modèle avec vision
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high' // Haute résolution pour meilleure précision
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1 // Basse température pour plus de précision
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erreur API OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0]?.message?.content || '';

    if (!extractedText.trim()) {
      throw new Error('Aucun texte extrait du document');
    }

    console.log(`[OCR] ✅ Texte extrait avec succès: ${extractedText.length} caractères`);
    return extractedText;

  } catch (error) {
    console.error('[OCR] Erreur lors de l\'extraction avec GPT-4 Vision:', error);
    throw new Error(`Échec de l'extraction OCR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait le texte d'un PDF scanné page par page
 */
export async function extractTextFromScannedPDF(file: File): Promise<string> {
  try {
    console.log(`[OCR] Extraction d'un PDF scanné: ${file.name}`);
    
    // Pour un PDF scanné, on utilise directement GPT-4 Vision
    // Note: Pour un vrai PDF multi-pages, il faudrait le convertir en images d'abord
    // Pour l'instant, on traite le PDF comme une seule image
    
    return await extractTextWithVision(file, 'legal');
  } catch (error) {
    console.error('[OCR] Erreur lors de l\'extraction du PDF scanné:', error);
    throw error;
  }
}

/**
 * Détecte automatiquement si un document nécessite l'OCR et extrait le texte
 */
export async function smartExtractText(file: File): Promise<{ text: string; usedOCR: boolean }> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Images: toujours utiliser l'OCR
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].includes(extension || '')) {
    const text = await extractTextWithVision(file, 'general');
    return { text, usedOCR: true };
  }
  
  // PDFs: détecter si scanné
  if (extension === 'pdf') {
    const isScanned = await isPDFScanned(file);
    if (isScanned) {
      const text = await extractTextFromScannedPDF(file);
      return { text, usedOCR: true };
    }
  }
  
  // Pour les autres formats, retourner vide (sera géré par extractTextFromFile)
  return { text: '', usedOCR: false };
}

export default {
  extractTextWithVision,
  extractTextFromScannedPDF,
  smartExtractText,
  isPDFScanned
};

