/**
 * Service pour l'API Realtime d'OpenAI
 * Permet des conversations vocales en temps réel avec l'IA
 */

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' | 'ash' | 'ballad' | 'coral' | 'sage' | 'verse' | 'cedar';
  instructions?: string;
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
      model: 'gpt-realtime',
      voice: 'cedar',
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
          
          // Configurer la session
          this.send({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: this.config.instructions || 'Vous êtes un assistant juridique expert qui aide à analyser des documents.',
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
            }
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
    
    // Gestion des événements spécifiques
    switch (message.type) {
      case 'session.created':
        console.log('[OK] Session créée');
        break;
      case 'session.updated':
        console.log('[OK] Session mise à jour');
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
        const pcm16 = this.floatTo16BitPCM(inputData);
        
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

