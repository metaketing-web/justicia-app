/**
 * Service d'export de documents en DOCX et PDF
 */

export async function exportToDocx(content: string, filename: string): Promise<void> {
    try {
        // Créer un blob avec le contenu formaté pour DOCX
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 2.54cm;
        }
        h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 12pt;
        }
        h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
        }
        p {
            margin-bottom: 6pt;
            text-align: justify;
        }
    </style>
</head>
<body>
${content.split('\n').map(line => `<p>${line}</p>`).join('\n')}
</body>
</html>`;

        const blob = new Blob([htmlContent], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        downloadBlob(blob, `${filename}.docx`);
    } catch (error) {
        console.error('Erreur lors de l\'export DOCX:', error);
        throw new Error('Impossible d\'exporter le document en DOCX');
    }
}

export async function exportToPdf(content: string, filename: string): Promise<void> {
    try {
        // Pour l'export PDF, on utilise l'impression du navigateur
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
        }

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        @page {
            size: A4;
            margin: 2.54cm;
        }
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.5;
        }
        h1 {
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 12pt;
        }
        h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
        }
        p {
            margin-bottom: 6pt;
            text-align: justify;
        }
        @media print {
            body {
                margin: 0;
            }
        }
    </style>
</head>
<body>
${content.split('\n').map(line => `<p>${line}</p>`).join('\n')}
<script>
    window.onload = function() {
        window.print();
        setTimeout(function() {
            window.close();
        }, 100);
    };
</script>
</body>
</html>`;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        throw new Error('Impossible d\'exporter le document en PDF');
    }
}

export function exportToTxt(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${filename}.txt`);
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
