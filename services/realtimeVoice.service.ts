/**
 * Service pour gérer la connexion WebSocket avec l'API OpenAI Realtime
 * Permet la conversation vocale bidirectionnelle en temps réel
 */

export interface RealtimeVoiceConfig {
    apiKey: string;
    model?: string;
    voice?: 'alloy' | 'echo' | 'shimmer' | 'cedar';
    instructions?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface RealtimeVoiceCallbacks {
    onConnected?: () => void;
    onDisconnected?: () => void;
    onError?: (error: Error) => void;
    onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
    onAudioResponse?: (audioData: ArrayBuffer) => void;
    onResponseComplete?: (transcript: string) => void;
    onInterrupted?: () => void;
}

export class RealtimeVoiceService {
    private ws: WebSocket | null = null;
    private config: RealtimeVoiceConfig;
    private callbacks: RealtimeVoiceCallbacks;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private audioWorkletNode: AudioWorkletNode | null = null;
    private isConnected = false;
    private sessionId: string | null = null;

    constructor(config: RealtimeVoiceConfig, callbacks: RealtimeVoiceCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
    }

    /**
     * Établir la connexion WebSocket avec l'API Realtime
     */
    async connect(): Promise<void> {
        try {
            // URL WebSocket de l'API Realtime
            const wsUrl = 'wss://api.openai.com/v1/realtime?model=' + (this.config.model || 'gpt-4o-realtime-preview-2024-10-01');
            
            this.ws = new WebSocket(wsUrl, [
                'realtime',
                `openai-insecure-api-key.${this.config.apiKey}`,
                'openai-beta.realtime-v1'
            ]);

            this.ws.binaryType = 'arraybuffer';

            this.ws.onopen = () => {
                console.log('[Realtime] WebSocket connecté');
                this.isConnected = true;
                
                // Configurer la session
                this.sendSessionUpdate();
                
                this.callbacks.onConnected?.();
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.ws.onerror = (error) => {
                console.error('[Realtime] Erreur WebSocket:', error);
                this.callbacks.onError?.(new Error('Erreur de connexion WebSocket'));
            };

            this.ws.onclose = () => {
                console.log('[Realtime] WebSocket déconnecté');
                this.isConnected = false;
                this.callbacks.onDisconnected?.();
            };

        } catch (error) {
            console.error('[Realtime] Erreur de connexion:', error);
            this.callbacks.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Envoyer la configuration de session initiale
     */
    private sendSessionUpdate(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const sessionConfig = {
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                instructions: this.config.instructions || 'Vous êtes JUSTICIA, un assistant juridique expert EXCLUSIVEMENT spécialisé en droit ivoirien.\n\nRÈGLES STRICTES :\n1. Vous NE répondez QU\'AUX questions liées au droit, à la justice, aux lois, aux contrats, et aux questions juridiques.\n2. Si on vous pose une question hors du domaine juridique (recettes, météo, sport, culture, etc.), répondez UNIQUEMENT : "Je suis désolé, je suis spécialisé exclusivement dans le droit ivoirien. Je ne peux pas répondre à des questions hors de ce domaine. Comment puis-je vous aider sur un sujet juridique ?"\n3. NE donnez JAMAIS d\'informations sur des sujets non juridiques, même si vous dites que ce n\'est pas votre spécialité.\n4. Pour les questions juridiques, fournissez des analyses approfondies, citez les sources légales, et structurez vos réponses de manière professionnelle.',
                voice: this.config.voice || 'alloy',
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
                },
                temperature: this.config.temperature || 0.8,
                max_response_output_tokens: this.config.maxTokens || 4096
            }
        };

        this.ws.send(JSON.stringify(sessionConfig));
        console.log('[Realtime] Configuration de session envoyée');
    }

    /**
     * Gérer les messages reçus du serveur
     */
    private handleMessage(data: string | ArrayBuffer): void {
        if (typeof data === 'string') {
            try {
                const message = JSON.parse(data);
                console.log('[Realtime] Message reçu:', message.type);

                switch (message.type) {
                    case 'session.created':
                        this.sessionId = message.session.id;
                        console.log('[Realtime] Session créée:', this.sessionId);
                        break;

                    case 'session.updated':
                        console.log('[Realtime] Session mise à jour');
                        break;

                    case 'input_audio_buffer.speech_started':
                        console.log('[Realtime] Détection de parole');
                        break;

                    case 'input_audio_buffer.speech_stopped':
                        console.log('[Realtime] Fin de parole détectée');
                        break;

                    case 'conversation.item.input_audio_transcription.completed':
                        // Transcription de l'utilisateur
                        const userTranscript = message.transcript;
                        this.callbacks.onTranscriptUpdate?.(userTranscript, true);
                        console.log('[Realtime] Transcription utilisateur:', userTranscript);
                        break;

                    case 'response.audio_transcript.delta':
                        // Transcription partielle de la réponse IA
                        const delta = message.delta;
                        this.callbacks.onTranscriptUpdate?.(delta, false);
                        break;

                    case 'response.audio_transcript.done':
                        // Transcription complète de la réponse IA
                        const fullTranscript = message.transcript;
                        this.callbacks.onResponseComplete?.(fullTranscript);
                        console.log('[Realtime] Transcription IA complète:', fullTranscript);
                        break;

                    case 'response.audio.delta':
                        // Audio de la réponse (base64)
                        const audioBase64 = message.delta;
                        const audioData = this.base64ToArrayBuffer(audioBase64);
                        this.callbacks.onAudioResponse?.(audioData);
                        break;

                    case 'response.audio.done':
                        console.log('[Realtime] Audio de réponse terminé');
                        break;

                    case 'response.done':
                        console.log('[Realtime] Réponse complète');
                        break;

                    case 'error':
                        console.error('[Realtime] Erreur serveur:', message.error);
                        this.callbacks.onError?.(new Error(message.error.message));
                        break;

                    case 'input_audio_buffer.committed':
                        console.log('[Realtime] Buffer audio validé');
                        break;

                    case 'rate_limits.updated':
                        console.log('[Realtime] Limites de taux mises à jour');
                        break;

                    default:
                        console.log('[Realtime] Type de message non géré:', message.type);
                }
            } catch (error) {
                console.error('[Realtime] Erreur de parsing JSON:', error);
            }
        }
    }

    /**
     * Démarrer la capture audio du microphone
     */
    async startAudioCapture(): Promise<void> {
        try {
            // Demander l'accès au microphone
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 24000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Créer le contexte audio
            this.audioContext = new AudioContext({ sampleRate: 24000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Créer un processeur audio pour capturer les données
            const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (event) => {
                if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

                const inputData = event.inputBuffer.getChannelData(0);
                
                // Convertir Float32Array en Int16Array (PCM16)
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Envoyer l'audio au serveur
                this.sendAudioData(pcm16.buffer);
            };

            source.connect(processor);
            processor.connect(this.audioContext.destination);

            console.log('[Realtime] Capture audio démarrée');
        } catch (error) {
            console.error('[Realtime] Erreur de capture audio:', error);
            this.callbacks.onError?.(error as Error);
            throw error;
        }
    }

    /**
     * Envoyer des données audio au serveur
     */
    private sendAudioData(audioData: ArrayBuffer): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const base64Audio = this.arrayBufferToBase64(audioData);
        
        const message = {
            type: 'input_audio_buffer.append',
            audio: base64Audio
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Interrompre la réponse en cours
     */
    interrupt(): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const message = {
            type: 'response.cancel'
        };

        this.ws.send(JSON.stringify(message));
        this.callbacks.onInterrupted?.();
        console.log('[Realtime] Réponse interrompue');
    }

    /**
     * Arrêter la capture audio
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

        console.log('[Realtime] Capture audio arrêtée');
    }

    /**
     * Déconnecter le WebSocket
     */
    disconnect(): void {
        this.stopAudioCapture();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        console.log('[Realtime] Déconnexion complète');
    }

    /**
     * Convertir ArrayBuffer en Base64
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
     * Convertir Base64 en ArrayBuffer
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
     * Vérifier si la connexion est active
     */
    isActive(): boolean {
        return this.isConnected && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
