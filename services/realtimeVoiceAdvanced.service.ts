/**
 * Service Realtime Voice Advanced avec OpenAI Agents SDK
 * Permet des conversations vocales en temps réel avec modification de documents
 */

import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

export interface DocumentModificationTool {
  name: string;
  description: string;
  parameters: any;
  handler: (args: any) => Promise<any>;
}

export interface RealtimeVoiceConfig {
  apiKey: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions?: string;
  tools?: DocumentModificationTool[];
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onDocumentModified?: (modification: any) => void;
}

export class RealtimeVoiceAdvancedService {
  private agent: RealtimeAgent | null = null;
  private session: RealtimeSession | null = null;
  private config: RealtimeVoiceConfig;
  private isConnected = false;

  constructor(config: RealtimeVoiceConfig) {
    this.config = {
      voice: 'coral', // Voix féminine sérieuse par défaut
      instructions: `Tu es un assistant juridique expert nommé Justicia. 
Tu aides les utilisateurs à créer, modifier et analyser des documents juridiques.
Tu peux modifier directement le contenu des documents en utilisant les outils à ta disposition.
Tu es professionnelle, précise et tu parles d'une voix claire et posée.`,
      ...config
    };
  }

  /**
   * Initialise et connecte l'agent Realtime
   */
  async connect(): Promise<void> {
    try {
      console.log('[Realtime Voice] Initialisation de l\'agent...');

      // Créer l'agent avec les outils de modification de documents
      this.agent = new RealtimeAgent({
        name: 'Justicia',
        instructions: this.config.instructions!,
        voice: this.config.voice,
        tools: this.config.tools?.map(tool => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
          handler: async (args: any) => {
            console.log(`[Realtime Voice] Exécution de l'outil: ${tool.name}`, args);
            const result = await tool.handler(args);
            
            // Notifier que le document a été modifié
            if (this.config.onDocumentModified) {
              this.config.onDocumentModified({
                tool: tool.name,
                args,
                result
              });
            }
            
            return result;
          }
        })) || []
      });

      // Créer la session
      this.session = new RealtimeSession(this.agent);

      // Écouter les événements de transcription
      this.session.on('transcript', (event: any) => {
        if (this.config.onTranscript && event.text) {
          this.config.onTranscript(event.text, event.role || 'user');
        }
      });

      // Connecter avec la clé API
      await this.session.connect({
        apiKey: this.config.apiKey
      });

      this.isConnected = true;
      console.log('[Realtime Voice] Connecté avec succès');
    } catch (error) {
      console.error('[Realtime Voice] Erreur de connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnecte la session
   */
  async disconnect(): Promise<void> {
    if (this.session) {
      await this.session.disconnect();
      this.isConnected = false;
      console.log('[Realtime Voice] Déconnecté');
    }
  }

  /**
   * Envoie un message texte (pour tester sans audio)
   */
  async sendText(text: string): Promise<void> {
    if (!this.session || !this.isConnected) {
      throw new Error('Session non connectée');
    }

    await this.session.sendText(text);
  }

  /**
   * Vérifie si la session est connectée
   */
  isSessionConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Met à jour les instructions de l'agent
   */
  updateInstructions(instructions: string): void {
    if (this.agent) {
      this.agent.instructions = instructions;
    }
  }

  /**
   * Ajoute un outil dynamiquement
   */
  addTool(tool: DocumentModificationTool): void {
    if (this.agent) {
      // Note: L'API du SDK peut nécessiter une reconnexion pour ajouter des outils
      console.warn('[Realtime Voice] Ajout d\'outil dynamique non supporté, reconnexion nécessaire');
    }
  }
}

/**
 * Outils prédéfinis pour la modification de documents
 */
export const createDocumentTools = (
  getCurrentContent: () => string,
  updateContent: (newContent: string) => void
): DocumentModificationTool[] => {
  return [
    {
      name: 'update_document_content',
      description: 'Remplace tout le contenu du document actuel par un nouveau contenu',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Le nouveau contenu complet du document'
          }
        },
        required: ['content']
      },
      handler: async (args: { content: string }) => {
        updateContent(args.content);
        return { success: true, message: 'Document mis à jour avec succès' };
      }
    },
    {
      name: 'insert_text',
      description: 'Insère du texte à la fin du document actuel',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Le texte à insérer'
          }
        },
        required: ['text']
      },
      handler: async (args: { text: string }) => {
        const currentContent = getCurrentContent();
        updateContent(currentContent + '\n\n' + args.text);
        return { success: true, message: 'Texte inséré avec succès' };
      }
    },
    {
      name: 'replace_text',
      description: 'Remplace une partie du texte dans le document',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Le texte à rechercher et remplacer'
          },
          replace: {
            type: 'string',
            description: 'Le nouveau texte de remplacement'
          }
        },
        required: ['search', 'replace']
      },
      handler: async (args: { search: string; replace: string }) => {
        const currentContent = getCurrentContent();
        const newContent = currentContent.replace(args.search, args.replace);
        
        if (newContent === currentContent) {
          return { success: false, message: 'Texte non trouvé dans le document' };
        }
        
        updateContent(newContent);
        return { success: true, message: 'Texte remplacé avec succès' };
      }
    },
    {
      name: 'get_document_content',
      description: 'Récupère le contenu actuel du document pour le lire ou l\'analyser',
      parameters: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const content = getCurrentContent();
        return { 
          success: true, 
          content,
          length: content.length,
          message: 'Contenu récupéré avec succès'
        };
      }
    }
  ];
};
