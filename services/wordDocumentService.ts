import { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Type de document pour déterminer quel en-tête utiliser
 */
export type DocumentType = 'justicia' | 'porteo';

/**
 * Options pour la génération de documents Word
 */
export interface WordDocumentOptions {
    type: DocumentType;
    title: string;
    content: string;
    filename?: string;
}

/**
 * Charge une image en tant que buffer pour l'inclure dans le document Word
 */
async function loadImageAsBuffer(imagePath: string): Promise<Uint8Array> {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

/**
 * Crée un paragraphe d'en-tête avec le logo
 */
async function createHeader(type: DocumentType): Promise<Paragraph[]> {
    const logoPath = type === 'justicia' 
        ? '/justicia-logo.png' 
        : '/templates/porteo-logo.png';
    
    try {
        const imageBuffer = await loadImageAsBuffer(logoPath);
        
        return [
            new Paragraph({
                children: [
                    new ImageRun({
                        data: imageBuffer,
                        transformation: {
                            width: 150,
                            height: 50,
                        },
                    }),
                ],
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: convertInchesToTwip(0.2),
                },
            }),
            new Paragraph({
                text: '',
                spacing: {
                    after: convertInchesToTwip(0.1),
                },
            }),
        ];
    } catch (error) {
        console.error('Erreur lors du chargement du logo:', error);
        // Fallback: retourner un en-tête texte
        return [
            new Paragraph({
                text: type === 'justicia' ? 'JUSTICIA' : 'PORTEO GROUP',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: {
                    after: convertInchesToTwip(0.2),
                },
            }),
        ];
    }
}

/**
 * Convertit le contenu Markdown/texte en paragraphes Word
 */
function convertContentToParagraphs(content: string): Paragraph[] {
    const lines = content.split('\n');
    const paragraphs: Paragraph[] = [];
    
    for (const line of lines) {
        if (line.trim() === '') {
            // Ligne vide
            paragraphs.push(
                new Paragraph({
                    text: '',
                    spacing: {
                        after: convertInchesToTwip(0.1),
                    },
                })
            );
        } else if (line.startsWith('# ')) {
            // Titre niveau 1
            paragraphs.push(
                new Paragraph({
                    text: line.substring(2),
                    heading: HeadingLevel.HEADING_1,
                    spacing: {
                        before: convertInchesToTwip(0.2),
                        after: convertInchesToTwip(0.1),
                    },
                })
            );
        } else if (line.startsWith('## ')) {
            // Titre niveau 2
            paragraphs.push(
                new Paragraph({
                    text: line.substring(3),
                    heading: HeadingLevel.HEADING_2,
                    spacing: {
                        before: convertInchesToTwip(0.15),
                        after: convertInchesToTwip(0.1),
                    },
                })
            );
        } else if (line.startsWith('### ')) {
            // Titre niveau 3
            paragraphs.push(
                new Paragraph({
                    text: line.substring(4),
                    heading: HeadingLevel.HEADING_3,
                    spacing: {
                        before: convertInchesToTwip(0.1),
                        after: convertInchesToTwip(0.05),
                    },
                })
            );
        } else if (line.startsWith('**') && line.endsWith('**')) {
            // Texte en gras
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: line.substring(2, line.length - 2),
                            bold: true,
                        }),
                    ],
                    spacing: {
                        after: convertInchesToTwip(0.05),
                    },
                })
            );
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            // Liste à puces
            paragraphs.push(
                new Paragraph({
                    text: line.substring(2),
                    bullet: {
                        level: 0,
                    },
                    spacing: {
                        after: convertInchesToTwip(0.05),
                    },
                })
            );
        } else {
            // Paragraphe normal
            paragraphs.push(
                new Paragraph({
                    text: line,
                    spacing: {
                        after: convertInchesToTwip(0.1),
                    },
                })
            );
        }
    }
    
    return paragraphs;
}

/**
 * Génère un document Word et le télécharge
 */
export async function generateWordDocument(options: WordDocumentOptions): Promise<void> {
    const { type, title, content, filename } = options;
    
    try {
        // Créer l'en-tête avec le logo
        const headerParagraphs = await createHeader(type);
        
        // Créer le titre du document
        const titleParagraph = new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                before: convertInchesToTwip(0.2),
                after: convertInchesToTwip(0.3),
            },
        });
        
        // Convertir le contenu en paragraphes
        const contentParagraphs = convertContentToParagraphs(content);
        
        // Créer le document
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        ...headerParagraphs,
                        titleParagraph,
                        ...contentParagraphs,
                    ],
                },
            ],
        });
        
        // Générer le fichier Word
        const blob = await Packer.toBlob(doc);
        
        // Télécharger le fichier
        const finalFilename = filename || `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
        saveAs(blob, finalFilename);
        
        console.log('Document Word généré avec succès:', finalFilename);
    } catch (error) {
        console.error('Erreur lors de la génération du document Word:', error);
        throw new Error('Impossible de générer le document Word');
    }
}

/**
 * Génère un document Word pour une analyse Justicia
 */
export async function generateAnalysisDocument(title: string, content: string, filename?: string): Promise<void> {
    return generateWordDocument({
        type: 'justicia',
        title,
        content,
        filename,
    });
}

/**
 * Génère un document Word pour une synthèse de chat Justicia
 */
export async function generateChatSummaryDocument(title: string, content: string, filename?: string): Promise<void> {
    return generateWordDocument({
        type: 'justicia',
        title,
        content,
        filename,
    });
}

/**
 * Génère un document Word pour un modèle PORTEO
 */
export async function generateTemplateDocument(title: string, content: string, filename?: string): Promise<void> {
    return generateWordDocument({
        type: 'porteo',
        title,
        content,
        filename,
    });
}

/**
 * Génère un document Word vierge PORTEO
 */
export async function generateBlankDocument(title: string, content: string, filename?: string): Promise<void> {
    return generateWordDocument({
        type: 'porteo',
        title,
        content,
        filename,
    });
}
