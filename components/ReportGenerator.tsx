import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

interface ReportGeneratorProps {
    results: AnalysisResult;
    documentTitle: string;
    onClose: () => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ results, documentTitle, onClose }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportFormat, setReportFormat] = useState<'pdf' | 'docx'>('pdf');

    const generatePDFReport = async () => {
        setIsGenerating(true);
        try {
            const pdf = new jsPDF();
            let yPosition = 20;

            // Logo JUSTICIA en haut
            try {
                const logoImg = new Image();
                logoImg.src = '/justicia-logo.jpg';
                await new Promise((resolve, reject) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = reject;
                });
                pdf.addImage(logoImg, 'JPEG', 20, 10, 60, 20);
                yPosition = 40;
            } catch (error) {
                console.log('Logo non chargé, utilisation du texte');
            }

            // Titre
            pdf.setFontSize(20);
            pdf.text('Rapport d\'Analyse Juridique', 20, yPosition);
            yPosition += 15;

            pdf.setFontSize(12);
            pdf.text(`Document analysé : ${documentTitle}`, 20, yPosition);
            yPosition += 10;
            pdf.text(`Date de génération : ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition);
            yPosition += 20;

            // Résumé en langage simple
            pdf.setFontSize(16);
            pdf.text('Résumé en Langage Simple', 20, yPosition);
            yPosition += 10;
            pdf.setFontSize(10);
            const summaryLines = pdf.splitTextToSize(results.plainLanguageSummary, 170);
            pdf.text(summaryLines, 20, yPosition);
            yPosition += summaryLines.length * 5 + 10;

            // Évaluation des risques
            if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.setFontSize(16);
            pdf.text('Évaluation des Risques', 20, yPosition);
            yPosition += 10;
            pdf.setFontSize(10);
            const riskLines = pdf.splitTextToSize(results.riskAssessment.overallSummary, 170);
            pdf.text(riskLines, 20, yPosition);
            yPosition += riskLines.length * 5 + 10;

            // Problèmes détectés
            if (results.flags.length > 0) {
                if (yPosition > 200) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.setFontSize(16);
                pdf.text('Problèmes Détectés', 20, yPosition);
                yPosition += 10;

                results.flags.forEach((flag, index) => {
                    if (yPosition > 250) {
                        pdf.addPage();
                        yPosition = 20;
                    }
                    pdf.setFontSize(12);
                    pdf.text(`${index + 1}. ${flag.title} (${flag.severity})`, 20, yPosition);
                    yPosition += 7;
                    pdf.setFontSize(10);
                    const explanationLines = pdf.splitTextToSize(flag.explanation, 170);
                    pdf.text(explanationLines, 25, yPosition);
                    yPosition += explanationLines.length * 5 + 5;
                });
            }

            // Insights IA
            if (yPosition > 200) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.setFontSize(16);
            pdf.text('Insights IA', 20, yPosition);
            yPosition += 10;
            pdf.setFontSize(10);
            const insightsLines = pdf.splitTextToSize(results.aiInsights.overallSummary, 170);
            pdf.text(insightsLines, 20, yPosition);

            pdf.save(`rapport_justicia_${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Erreur lors de la génération du rapport PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateWordReport = async () => {
        setIsGenerating(true);
        try {
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: "Rapport d'Analyse Juridique - Justicia",
                            heading: HeadingLevel.TITLE,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Document analysé : ${documentTitle}`,
                                    bold: true,
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Date de génération : ${new Date().toLocaleDateString('fr-FR')}`,
                                }),
                            ],
                        }),
                        new Paragraph({ text: "" }), // Ligne vide
                        new Paragraph({
                            text: "Résumé en Langage Simple",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({
                            text: results.plainLanguageSummary,
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            text: "Évaluation des Risques",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({
                            text: results.riskAssessment.overallSummary,
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            text: "Problèmes Détectés",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        ...(Array.isArray(results.flags) ? results.flags : []).map(flag => [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${flag.title} (${flag.severity})`,
                                        bold: true,
                                    }),
                                ],
                            }),
                            new Paragraph({
                                text: flag.explanation,
                            }),
                            new Paragraph({ text: "" }),
                        ]).flat(),
                        new Paragraph({
                            text: "Insights IA",
                            heading: HeadingLevel.HEADING_1,
                        }),
                        new Paragraph({
                            text: results.aiInsights.overallSummary,
                        }),
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport_justicia_${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur lors de la génération du Word:', error);
            alert('Erreur lors de la génération du rapport Word');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = () => {
        if (reportFormat === 'pdf') {
            generatePDFReport();
        } else {
            generateWordReport();
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur animate-fadeIn">
            <div className="bg-neutral-900 p-8 rounded-xl shadow-2xl max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6 text-white">Générer un Rapport</h2>
                
                <div className="mb-6">
                    <label className="block text-gray-300 mb-3">Format du rapport :</label>
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="pdf"
                                checked={reportFormat === 'pdf'}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportFormat(e.target.value as 'pdf')}
                                className="mr-2"
                            />
                            <span className="text-white">PDF (Portable Document Format)</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="docx"
                                checked={reportFormat === 'docx'}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportFormat(e.target.value as 'docx')}
                                className="mr-2"
                            />
                            <span className="text-white">Word (DOCX)</span>
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-gray-400 text-sm">
                        Le rapport inclura : résumé en langage simple, évaluation des risques, 
                        problèmes détectés et insights IA.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="flex-1 px-4 py-2 bg-justicia-gradient text-white hover:text-black rounded-full font-semibold hover:bg-justicia-gradient/80 transition disabled:opacity-50"
                    >
                        {isGenerating ? 'Génération...' : `Générer ${reportFormat.toUpperCase()}`}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-neutral-700 text-white rounded-full font-semibold hover:bg-neutral-600 transition"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportGenerator;
