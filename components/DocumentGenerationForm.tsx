import React, { useState } from 'react';
import { FileText, Mic, Sparkles, Download, ArrowLeft, Loader2, AudioWaveform } from 'lucide-react';
import { DocumentTemplate, DocumentField } from '../config/documentTemplates';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface DocumentGenerationFormProps {
  template: DocumentTemplate;
  onBack: () => void;
  onGenerate: (data: Record<string, string>) => Promise<void>;
}

const DocumentGenerationForm: React.FC<DocumentGenerationFormProps> = ({ template, onBack, onGenerate }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showVoiceEditor, setShowVoiceEditor] = useState(false);

  // Voice input pour remplir les champs
  const voiceInput = useVoiceInput({
    onTranscript: (text) => {
      if (activeField) {
        setFormData(prev => ({
          ...prev,
          [activeField]: (prev[activeField] || '') + ' ' + text
        }));
      }
    },
    onError: (error) => {
      console.error('Erreur vocal:', error);
    }
  });

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleVoiceToggle = (fieldId: string) => {
    if (voiceInput.isRecording && activeField === fieldId) {
      voiceInput.toggleRecording();
      setActiveField(null);
    } else {
      setActiveField(fieldId);
      voiceInput.toggleRecording();
    }
  };

  const handleAiFill = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiProcessing(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tu es un assistant juridique. Génère les données pour remplir un formulaire de "${template.name}".

Voici les champs à remplir:
${template.fields.map(f => `- ${f.label} (${f.type}): ${f.placeholder || ''}`).join('\n')}

Contexte fourni par l'utilisateur: ${aiPrompt}

Réponds UNIQUEMENT avec un objet JSON contenant les valeurs pour chaque champ. Format:
{
  "champ_id": "valeur",
  ...
}

Ne génère que les champs pour lesquels tu as assez d'informations. Utilise le contexte pour remplir intelligemment les champs.`,
          context: '',
          sessionId: 'doc-gen-' + Date.now()
        })
      });

      if (!response.ok) throw new Error('Erreur API');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value, { stream: true });
        }
      }

      // Extraire le JSON de la réponse
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestedData = JSON.parse(jsonMatch[0]);
        
        // Mapper les données suggérées aux IDs de champs
        const mappedData: Record<string, string> = {};
        template.fields.forEach(field => {
          // Essayer de trouver la correspondance
          const possibleKeys = [
            field.id,
            field.label.toLowerCase().replace(/['\s]/g, '_'),
            field.label.toLowerCase()
          ];
          
          for (const key of possibleKeys) {
            if (suggestedData[key]) {
              mappedData[field.id] = suggestedData[key];
              break;
            }
          }
        });

        setFormData(prev => ({ ...prev, ...mappedData }));
      }

      setAiPrompt('');
    } catch (error) {
      console.error('Erreur IA:', error);
      alert('Erreur lors du remplissage par IA');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier les champs requis
    const missingFields = template.fields
      .filter(f => f.required && !formData[f.id]?.trim())
      .map(f => f.label);

    if (missingFields.length > 0) {
      alert(`Champs requis manquants:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(formData);
    } catch (error) {
      console.error('Erreur génération:', error);
      alert('Erreur lors de la génération du document');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderField = (field: DocumentField) => {
    const isActive = activeField === field.id && voiceInput.isRecording;

    return (
      <div key={field.id} className="space-y-2">
        <label className="flex items-center justify-between text-sm font-medium text-gray-300">
          <span>
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </span>
          <button
            type="button"
            onClick={() => handleVoiceToggle(field.id)}
            className={`p-1.5 rounded-lg transition-all ${
              isActive
                ? 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white animate-pulse'
                : 'bg-neutral-700 text-gray-400 hover:bg-neutral-600'
            }`}
            title="Dicter ce champ"
          >
            <Mic className="w-4 h-4" />
          </button>
        </label>

        {field.type === 'textarea' ? (
          <textarea
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        ) : field.type === 'select' ? (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Sélectionner...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <FileText className="w-7 h-7 text-purple-400" />
                {template.name}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{template.description}</p>
            </div>
          </div>

          {/* Assistant IA */}
          <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-orange-900/30 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-white font-medium">Remplissage Automatique par IA</span>
              </div>
              <button
                onClick={() => setShowVoiceEditor(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-600 hover:from-cyan-700 hover:via-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                title="Modifier avec l'IA vocale"
              >
                <AudioWaveform className="w-4 h-4" />
                Modifier par Voix
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiFill()}
                placeholder="Ex: Contrat pour transport de sable, 100 tonnes, de Abidjan à Yamoussoukro..."
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isAiProcessing}
              />
              <button
                onClick={handleAiFill}
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAiProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Remplir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {template.fields.map(renderField)}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-900/50 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            <Mic className="w-4 h-4 inline mr-1" />
            Cliquez sur le micro pour dicter un champ
          </p>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Générer le Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerationForm;
