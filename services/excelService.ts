/**
 * Service pour lire et analyser les fichiers Excel
 */

import * as XLSX from 'xlsx';

export interface ExcelData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  totalRows: number;
  totalColumns: number;
}

export interface ExcelAnalysis {
  fileName: string;
  sheets: ExcelData[];
  summary: string;
  totalSheets: number;
}

/**
 * Lit un fichier Excel et extrait les données
 */
export async function readExcelFile(file: File): Promise<ExcelAnalysis> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Impossible de lire le fichier');
        }

        // Lire le fichier Excel
        const workbook = XLSX.read(data, { type: 'binary' });
        
        const sheets: ExcelData[] = [];

        // Parcourir toutes les feuilles
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (jsonData.length === 0) {
            return; // Feuille vide
          }

          // Extraire les en-têtes (première ligne)
          const headers = jsonData[0]?.map(h => String(h || '')) || [];
          
          // Extraire les données (lignes suivantes)
          const rows = jsonData.slice(1);

          sheets.push({
            sheetName,
            headers,
            rows,
            totalRows: rows.length,
            totalColumns: headers.length
          });
        });

        // Créer un résumé
        const summary = `Fichier Excel avec ${sheets.length} feuille(s). ` +
          sheets.map(s => `"${s.sheetName}": ${s.totalRows} lignes × ${s.totalColumns} colonnes`).join(', ');

        resolve({
          fileName: file.name,
          sheets,
          summary,
          totalSheets: sheets.length
        });

      } catch (error) {
        reject(new Error(`Erreur lors de la lecture du fichier Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Convertit les données Excel en texte pour l'analyse IA
 */
export function excelToText(excelAnalysis: ExcelAnalysis): string {
  let text = `# Analyse du fichier Excel: ${excelAnalysis.fileName}\n\n`;
  text += `${excelAnalysis.summary}\n\n`;

  excelAnalysis.sheets.forEach((sheet, index) => {
    text += `## Feuille ${index + 1}: ${sheet.sheetName}\n\n`;
    text += `**Dimensions:** ${sheet.totalRows} lignes × ${sheet.totalColumns} colonnes\n\n`;

    // Ajouter les en-têtes
    if (sheet.headers.length > 0) {
      text += `**En-têtes:** ${sheet.headers.join(' | ')}\n\n`;
    }

    // Ajouter un échantillon des données (premières 10 lignes)
    const sampleSize = Math.min(10, sheet.rows.length);
    if (sampleSize > 0) {
      text += `**Échantillon des données (${sampleSize} premières lignes):**\n\n`;
      
      for (let i = 0; i < sampleSize; i++) {
        const row = sheet.rows[i];
        text += `Ligne ${i + 1}: ${row.join(' | ')}\n`;
      }
      
      if (sheet.rows.length > sampleSize) {
        text += `\n... et ${sheet.rows.length - sampleSize} autres lignes\n`;
      }
    }

    text += '\n---\n\n';
  });

  return text;
}

/**
 * Détecte le type de données dans une colonne
 */
export function detectColumnType(values: any[]): 'number' | 'date' | 'text' | 'boolean' | 'mixed' {
  const types = new Set<string>();
  
  values.forEach(value => {
    if (value === null || value === undefined || value === '') {
      return;
    }
    
    if (typeof value === 'number') {
      types.add('number');
    } else if (typeof value === 'boolean') {
      types.add('boolean');
    } else if (value instanceof Date) {
      types.add('date');
    } else if (!isNaN(Date.parse(String(value)))) {
      types.add('date');
    } else if (!isNaN(Number(value))) {
      types.add('number');
    } else {
      types.add('text');
    }
  });

  if (types.size === 0) return 'text';
  if (types.size > 1) return 'mixed';
  
  return Array.from(types)[0] as any;
}

/**
 * Calcule des statistiques basiques pour une colonne numérique
 */
export function calculateColumnStats(values: any[]): {
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
} | null {
  const numbers = values
    .map(v => Number(v))
    .filter(n => !isNaN(n));

  if (numbers.length === 0) {
    return null;
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = sum / numbers.length;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  return {
    min,
    max,
    avg,
    sum,
    count: numbers.length
  };
}

export default {
  readExcelFile,
  excelToText,
  detectColumnType,
  calculateColumnStats
};

