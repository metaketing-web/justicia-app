/**
 * Service de génération de documents Word et PDF avec en-tête PORTEO GROUP
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer, ImageRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface PorteoDocumentOptions {
  title: string;
  content: string;
  author?: string;
  date?: Date;
}

/**
 * Génère un document Word (.docx) avec l'en-tête PORTEO GROUP
 */
export async function generatePorteoWordDocument(options: PorteoDocumentOptions): Promise<void> {
  const { title, content, author = 'PORTEO GROUP', date = new Date() } = options;

  // Créer l'en-tête avec le logo PORTEO GROUP
  const header = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'PORTEO',
            font: 'Arial',
            size: 32,
            bold: true,
            color: '000000',
          }),
          new TextRun({
            text: ' GROUP',
            font: 'Arial',
            size: 24,
            color: '666666',
          }),
        ],
        spacing: {
          after: 200,
        },
        border: {
          bottom: {
            color: 'D4AF37', // Or/doré
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
      }),
    ],
  });

  // Créer le pied de page
  const footer = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: 'PORTEO GROUP - Document généré le ' + date.toLocaleDateString('fr-FR'),
            size: 18,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 200,
        },
      }),
    ],
  });

  // Convertir le contenu Markdown en paragraphes
  const contentParagraphs = parseMarkdownToDocx(content);

  // Créer le document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: header,
        },
        footers: {
          default: footer,
        },
        children: [
          // Titre du document
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: {
              before: 400,
              after: 400,
            },
            alignment: AlignmentType.CENTER,
          }),
          // Contenu
          ...contentParagraphs,
        ],
      },
    ],
  });

  // Générer et télécharger le fichier
  const blob = await Packer.toBlob(doc);
  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_porteo.docx`;
  saveAs(blob, filename);
}

/**
 * Parse le contenu Markdown en paragraphes docx
 */
function parseMarkdownToDocx(markdown: string): Paragraph[] {
  const lines = markdown.split('\n');
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // Ligne vide
      paragraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // Titres
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );
    } else if (line.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (line.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    }
    // Listes à puces
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          text: line.substring(2),
          bullet: {
            level: 0,
          },
          spacing: { before: 100, after: 100 },
        })
      );
    }
    // Listes numérotées
    else if (/^\d+\.\s/.test(line)) {
      paragraphs.push(
        new Paragraph({
          text: line.replace(/^\d+\.\s/, ''),
          numbering: {
            reference: 'default-numbering',
            level: 0,
          },
          spacing: { before: 100, after: 100 },
        })
      );
    }
    // Texte gras/italique
    else {
      const textRuns = parseInlineFormatting(line);
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: { before: 100, after: 100 },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Parse le formatage inline (gras, italique)
 */
function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  
  // Simple parsing - améliorer si nécessaire
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Gras
      runs.push(new TextRun({
        text: part.substring(2, part.length - 2),
        bold: true,
      }));
    } else if (part.startsWith('*') && part.endsWith('*')) {
      // Italique
      runs.push(new TextRun({
        text: part.substring(1, part.length - 1),
        italics: true,
      }));
    } else if (part) {
      runs.push(new TextRun({ text: part }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text })];
}

/**
 * Génère un document PDF avec l'en-tête PORTEO GROUP
 */
export async function generatePorteoPdfDocument(options: PorteoDocumentOptions): Promise<void> {
  const { title, content, date = new Date() } = options;
  
  // Utiliser jsPDF pour générer le PDF
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // En-tête PORTEO GROUP
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTEO', 20, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('GROUP', 55, 20);
  
  // Ligne de séparation dorée
  doc.setDrawColor(212, 175, 55); // Or
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  // Titre du document
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, 105, 40, { align: 'center' });

  // Contenu
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const lines = doc.splitTextToSize(content, 170);
  let y = 55;
  
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += 7;
  }

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `PORTEO GROUP - Document généré le ${date.toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Télécharger
  const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_porteo.pdf`;
  doc.save(filename);
}
