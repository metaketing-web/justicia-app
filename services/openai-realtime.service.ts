/**
 * Service pour l'API Realtime d'OpenAI
 * Permet des conversations vocales en temps réel avec l'IA
 */

export interface RealtimeTool {
  name: string;
  description: string;
  parameters: any;
}

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse';
  instructions?: string;
  tools?: RealtimeTool[];
  onToolCall?: (toolName: string, args: any) => Promise<any>;
}

export interface RealtimeMessage {
  type: string;
  [key: string]: any;
}

export class OpenAIRealtimeService {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private config: RealtimeConfig;
  private isConnected = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private currentAudioSources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;

  constructor(config: RealtimeConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview',
      voice: 'coral',
      ...config
    };
  }

  /**
   * Connecte au service Realtime via WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // URL WebSocket de l'API Realtime OpenAI directe
        const wsUrl = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
        
        this.ws = new WebSocket(wsUrl, [
          'realtime',
          `openai-insecure-api-key.${this.config.apiKey}`,
          'openai-beta.realtime-v1'
        ]);

        this.ws.onopen = () => {
          console.log('[OK] Connecte a l API Realtime');
          this.isConnected = true;
          
          // Configurer la session avec les outils
          const sessionConfig: any = {
            modalities: ['text', 'audio'],
            instructions: this.config.instructions || 'Tu es Justicia, un assistant juridique expert. Tu aides à créer, modifier et analyser des documents juridiques. Tu peux modifier directement le contenu des documents en utilisant les outils à ta disposition. Tu es professionnelle, précise et tu parles d\'une voix claire et posée.',
            voice: this.config.voice,
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          };
          
          // Ajouter les outils si fournis
          if (this.config.tools && this.config.tools.length > 0) {
            sessionConfig.tools = this.config.tools.map(tool => ({
              type: 'function',
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }));
          }
          
          this.send({
            type: 'session.update',
            session: sessionConfig
          });
          
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('[ERREUR] Erreur WebSocket:', error);
          this.isConnected = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[DECONNEXION] Deconnecte de l API Realtime');
          this.isConnected = false;
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Erreur de parsing du message:', error);
          }
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Envoie un message au serveur Realtime
   */
  private send(message: RealtimeMessage): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Gère les messages reçus du serveur
   */
  private handleMessage(message: RealtimeMessage): void {
    console.log('[MSG] Message reçu:', message.type);
    
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
    
    // Géstion des événements spécifiques
    switch (message.type) {
      case 'session.created':
        console.log('[OK] Session créée');
        break;
      case 'session.updated':
        console.log('[OK] Session mise à jour');
        break;
      case 'response.function_call_arguments.done':
        this.handleFunctionCall(message);
        break;
      case 'error':
        console.error('[ERREUR] Erreur:', message.error);
        break;
    }
  }

  /**
   * Enregistre un handler pour un type de message
   */
  on(eventType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(eventType, handler);
  }

  /**
   * Démarre la capture audio du microphone
   */
  async startAudioCapture(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Créer un processeur audio pour envoyer les données
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!this.isConnected) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const sourceSampleRate = this.audioContext!.sampleRate;
        
        // Rééchantillonner à 24kHz si nécessaire
        const resampled = this.resample(inputData, sourceSampleRate, 24000);
        const pcm16 = this.floatTo16BitPCM(resampled);
        
        // Envoyer l'audio au serveur
        this.send({
          type: 'input_audio_buffer.append',
          audio: this.arrayBufferToBase64(pcm16.buffer)
        });
      };
      
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      console.log('[MIC] Capture audio démarrée');
    } catch (error) {
      console.error('Erreur lors de la capture audio:', error);
      throw error;
    }
  }

  /**
   * Arrête la capture audio
   */
  stopAudioCapture(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('[MIC] Capture audio arrêtée');
  }

  /**
   * Envoie un message texte
   */
  sendText(text: string): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text
        }]
      }
    });
    
    // Demander une réponse
    this.send({
      type: 'response.create'
    });
  }

  /**
   * Joue l'audio reçu de manière fluide
   */
  async playAudio(base64Audio: string): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.nextStartTime = this.audioContext.currentTime;
    }
    
    const audioData = this.base64ToArrayBuffer(base64Audio);
    const pcm16 = new Int16Array(audioData);
    const float32 = this.pcm16ToFloat(pcm16);
    
    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    // Planifier la lecture pour qu'elle s'enchaîne sans coupure
    const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
    source.start(startTime);
    
    // Mettre à jour le temps de début suivant
    this.nextStartTime = startTime + audioBuffer.duration;
    
    // Nettoyer la source quand elle se termine
    source.onended = () => {
      const index = this.currentAudioSources.indexOf(source);
      if (index > -1) {
        this.currentAudioSources.splice(index, 1);
      }
    };
    
    this.currentAudioSources.push(source);
  }

  /**
   * Convertit Float32 en PCM16
   */
  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  /**
   * Convertit PCM16 en Float32
   */
  private pcm16ToFloat(pcm16Array: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16Array.length);
    for (let i = 0; i < pcm16Array.length; i++) {
      float32[i] = pcm16Array[i] / (pcm16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
  }

  /**
   * Convertit ArrayBuffer en Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convertit Base64 en ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Gère les appels de fonction de l'IA
   */
  private async handleFunctionCall(message: any): Promise<void> {
    const { call_id, name, arguments: argsString } = message;
    
    console.log(`[TOOL] Appel de fonction: ${name}`);
    
    try {
      const args = JSON.parse(argsString);
      
      // Exécuter le callback si fourni
      let result: any;
      if (this.config.onToolCall) {
        result = await this.config.onToolCall(name, args);
      } else {
        result = { success: false, message: 'Aucun gestionnaire de fonction configuré' };
      }
      
      // Envoyer le résultat au serveur
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify(result)
        }
      });
      
      // Demander une réponse
      this.send({
        type: 'response.create'
      });
      
    } catch (error) {
      console.error('[TOOL] Erreur lors de l\'exécution de la fonction:', error);
      
      // Envoyer une erreur au serveur
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Erreur inconnue' 
          })
        }
      });
    }
  }

  /**
   * Rééchantillonne l'audio du taux source vers le taux cible
   */
  private resample(audioData: Float32Array, sourceSampleRate: number, targetSampleRate: number): Float32Array {
    if (sourceSampleRate === targetSampleRate) {
      return audioData;
    }
    
    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;
      
      if (index + 1 < audioData.length) {
        // Interpolation linéaire
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index];
      }
    }
    
    return result;
  }

  /**
   * Déconnecte du service
   */
  disconnect(): void {
    this.stopAudioCapture();
    
    // Arreter toutes les sources audio
    this.currentAudioSources.forEach(s => {
      try {
        s.stop();
      } catch (e) {
        // Ignorer
      }
    });
    this.currentAudioSources = [];
    this.nextStartTime = 0;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Vérifie si le service est connecté
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

export default OpenAIRealtimeService;

