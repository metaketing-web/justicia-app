import { DocumentTemplate } from '../data/templates';
import { generateCompletion } from './llama-api.services';

export async function generateDocumentFromTemplate(
    template: DocumentTemplate,
    formData: Record<string, any>
): Promise<string> {
    // Construire le prompt pour l'IA
    let prompt = template.aiPrompt;

    // Remplacer les placeholders par les valeurs du formulaire
    Object.keys(formData).forEach(key => {
        const placeholder = `{${key}}`;
        prompt = prompt.replace(new RegExp(placeholder, 'g'), formData[key] || '[NON RENSEIGNÉ]');
    });

    // Ajouter le contexte et les instructions
    const fullPrompt = `Tu es un assistant juridique spécialisé dans la rédaction de documents professionnels pour le secteur du BTP et de la construction.

TÂCHE: ${prompt}

INSTRUCTIONS:
1. Rédige un document professionnel, formel et juridiquement correct
2. Utilise un ton approprié selon le type de document
3. Inclus toutes les mentions légales et formules de politesse nécessaires
4. Structure le document de manière claire avec des sections bien définies
5. Assure-toi que le document soit complet et prêt à être utilisé
6. Si des informations sont marquées [NON RENSEIGNÉ], utilise des placeholders clairs comme [À COMPLÉTER]

FORMAT:
- Commence par l'en-tête (expéditeur, destinataire, date, objet)
- Développe le corps du document
- Termine par les formules de politesse et signatures

DOCUMENT:`;

    try {
        const generatedContent = await generateCompletion(fullPrompt);

        return generatedContent;
    } catch (error) {
        console.error('Erreur lors de la génération du document:', error);
        throw new Error('Impossible de générer le document. Veuillez réessayer.');
    }
}

export async function fillTemplateFieldsWithAI(
    templateId: string,
    fields: any[],
    userPrompt: string
): Promise<Record<string, any>> {
    const prompt = `Tu es un assistant IA qui aide à remplir des formulaires de documents juridiques.

CHAMPS DU FORMULAIRE:
${fields.map(f => `- ${f.name} (${f.label}): ${f.type}${f.required ? ' [REQUIS]' : ''}`).join('\n')}

DEMANDE DE L'UTILISATEUR:
${userPrompt}

INSTRUCTIONS:
1. Analyse la demande de l'utilisateur
2. Extrait les informations pertinentes pour chaque champ
3. Retourne un objet JSON avec les valeurs des champs
4. Si une information n'est pas fournie, laisse le champ vide
5. Pour les dates, utilise le format YYYY-MM-DD
6. Pour les nombres, utilise uniquement des chiffres

RÉPONSE (JSON uniquement, sans explication):`;

    try {
        const response = await generateCompletion(prompt);

        // Parser la réponse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        throw new Error('Format de réponse invalide');
    } catch (error) {
        console.error('Erreur lors du remplissage automatique:', error);
        throw new Error('Impossible de remplir automatiquement les champs. Veuillez les remplir manuellement.');
    }
}
