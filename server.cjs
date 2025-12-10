require('dotenv').config({ override: true });

const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const https = require('https');
const multer = require('multer');
const FormData = require('form-data');

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques du dossier dist
app.use(express.static(path.join(__dirname, 'dist')));

// CORS pour permettre les requêtes depuis Vite (port 5173)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Désactiver le cache pour forcer le rechargement
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('Surrogate-Control', 'no-store');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

/**
 * POST /api/generate-docx et /api/word
 * Génère un document Word avec papier à en-tête PORTEO
 */
const generateDocxHandler = async (req, res) => {
    const { content, headerType = 'porteo' } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Le contenu est requis' });
    }

    const timestamp = Date.now();
    const tempJsonPath = path.join(__dirname, `temp_word_${timestamp}.json`);
    const outputPath = path.join(__dirname, 'dist', `document_${timestamp}.docx`);

    try {
        const templateType = headerType === 'justicia' ? 'justicia' : 'porteo';
        console.log(`[API/WORD] Génération de document Word avec en-tête ${templateType}`);
        
        // Préparer les données pour le script
        const documentData = {
            title: templateType === 'justicia' ? 'Rapport Justicia' : 'Document Porteo',
            date: new Date().toLocaleDateString('fr-FR'),
            sections: [{
                title: '',
                content: content
            }]
        };
        
        // Écrire les données JSON
        await writeFileAsync(tempJsonPath, JSON.stringify(documentData));
        
        // Exécuter le script Python
        const scriptPath = path.join(__dirname, 'scripts', 'generate_word_with_header.py');
        const command = `python3 "${scriptPath}" "${tempJsonPath}" "${outputPath}" "${templateType}"`;
        
        console.log('[API/WORD] Exécution du script');
        await execAsync(command);

        // Lire le fichier généré
        const docxBuffer = await readFileAsync(outputPath);

        // Nettoyer les fichiers temporaires
        await unlinkAsync(tempJsonPath).catch(() => {});
        await unlinkAsync(outputPath).catch(() => {});

        // Envoyer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="document_porteo_${timestamp}.docx"`);
        res.send(docxBuffer);

        console.log('[API/WORD] Document envoyé avec succès');
    } catch (error) {
        console.error('[API/WORD] Erreur:', error);
        
        // Nettoyer en cas d'erreur
        await unlinkAsync(tempJsonPath).catch(() => {});
        await unlinkAsync(outputPath).catch(() => {});
        
        res.status(500).json({ 
            error: 'Erreur lors de la génération du document',
            details: error.message 
        });
    }
};

app.post('/api/generate-docx', generateDocxHandler);
app.post('/api/word', generateDocxHandler);

/**
 * POST /api/tts
 * Génère de l'audio avec OpenAI TTS
 */
app.post('/api/tts', async (req, res) => {
    const { text, voice = 'cedar' } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Le texte est requis' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Clé API OpenAI non configurée' });
    }

    try {
        console.log('[TTS] Génération audio demandée, voix:', voice);
        
        const postData = JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voice,
            response_format: 'mp3',
            speed: 1.0  // Vitesse normale
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/audio/speech',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const apiReq = https.request(options, (apiRes) => {
            if (apiRes.statusCode !== 200) {
                console.error('[TTS] Erreur API OpenAI:', apiRes.statusCode);
                return res.status(apiRes.statusCode).json({ error: 'Erreur API OpenAI' });
            }

            res.setHeader('Content-Type', 'audio/mpeg');
            apiRes.pipe(res);
            console.log('[TTS] Audio envoyé avec succès');
        });

        apiReq.on('error', (error) => {
            console.error('[TTS] Erreur requête:', error);
            res.status(500).json({ error: 'Erreur lors de la génération audio' });
        });

        apiReq.write(postData);
        apiReq.end();
        
    } catch (error) {
        console.error('[TTS] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la génération audio',
            details: error.message 
        });
    }
});

/**
 * POST /api/chat
 * Génère du contenu avec OpenAI
 */
app.post('/api/chat', async (req, res) => {
    const { message, conversationHistory = [], messages } = req.body;

    // Support deux formats: ancien (message) et nouveau (messages)
    let finalMessages;
    if (messages) {
        // Format DocumentEditor avec messages direct
        finalMessages = messages;
    } else if (message) {
        // Format ancien avec message simple
        finalMessages = [
            { role: 'system', content: 'Tu es un assistant juridique expert. Génère des documents juridiques professionnels et précis.' },
            ...conversationHistory,
            { role: 'user', content: message }
        ];
    } else {
        return res.status(400).json({ error: 'Le message ou messages est requis' });
    }

    try {
        console.log('[CHAT] Requête reçue:', JSON.stringify(finalMessages).substring(0, 100));
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY non configurée');
        }

        const postData = JSON.stringify({
            model: 'gpt-4o-mini',
            messages: finalMessages,
            temperature: 0.7,
            max_tokens: 4000
        });

        const options = {
            hostname: 'api.openai.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const apiReq = https.request(options, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.error) {
                        console.error('[CHAT] Erreur OpenAI:', response.error);
                        return res.status(500).json({ error: response.error.message });
                    }
                    
                    const content = response.choices[0].message.content;
                    console.log('[CHAT] Réponse générée:', content.substring(0, 100));
                    res.json({ response: content });
                } catch (parseError) {
                    console.error('[CHAT] Erreur parsing:', parseError);
                    res.status(500).json({ error: 'Erreur lors du parsing de la réponse' });
                }
            });
        });

        apiReq.on('error', (error) => {
            console.error('[CHAT] Erreur requête:', error);
            res.status(500).json({ error: error.message });
        });

        apiReq.write(postData);
        apiReq.end();
        
    } catch (error) {
        console.error('[CHAT] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la génération',
            details: error.message 
        });
    }
});

/**
 * POST /api/brave-search
 * Recherche web avec Brave Search API
 */
app.post('/api/brave-search', async (req, res) => {
    const { query, count = 5, country } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'La requête de recherche est requise' });
    }

    const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
    
    if (!BRAVE_API_KEY) {
        console.error('[Brave Search] Clé API manquante');
        return res.status(500).json({ 
            error: 'Clé API Brave Search non configurée',
            query,
            results: [],
            success: false
        });
    }

    try {
        console.log(`[Brave Search] Recherche: "${query}"`);
        
        // Ajouter priorité .CI pour la Côte d'Ivoire
        const searchQuery = `${query} site:.ci OR site:.com`;
        const searchCountry = country || 'CI';  // Côte d'Ivoire par défaut
        
        // Construire l'URL avec géolocalisation
        let url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=${count}&country=${searchCountry}`;
        console.log(`[Brave Search] Géolocalisation: ${searchCountry}`);
        console.log(`[Brave Search] Requête modifiée: "${searchQuery}"`);
    
        
        const options = {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip',
                'X-Subscription-Token': BRAVE_API_KEY
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                const chunks = [];
                
                // Décompresser si gzip
                const stream = res.headers['content-encoding'] === 'gzip' 
                    ? res.pipe(require('zlib').createGunzip())
                    : res;
                
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', () => {
                    const data = Buffer.concat(chunks).toString('utf-8');
                    resolve({ status: res.statusCode, data });
                });
                stream.on('error', reject);
            });
            req.on('error', reject);
            req.end();
        });

        if (response.status !== 200) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const braveData = JSON.parse(response.data);
        
        // Formater les résultats
        const results = (braveData.web?.results || []).slice(0, count).map(result => ({
            title: result.title,
            url: result.url,
            description: result.description || result.snippet || '',
            age: result.age
        }));

        console.log(`[Brave Search] ${results.length} résultats trouvés`);

        res.json({
            query,
            results,
            success: true
        });

    } catch (error) {
        console.error('[Brave Search] Erreur:', error);
        res.status(500).json({
            error: error.message,
            query,
            results: [],
            success: false
        });
    }
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Route de test
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'API de génération de documents Word, TTS et Chat opérationnelle' });
});

/**
 * POST /api/fill-template
 * Remplit un template Word avec des données
 */
app.post('/api/fill-template', async (req, res) => {
    const { templateFilename, data } = req.body;
    
    if (!templateFilename || !data) {
        return res.status(400).json({ error: 'Template et données requis' });
    }
    
    const templatePath = path.join(__dirname, 'public', 'templates', templateFilename);
    const outputPath = path.join(__dirname, 'dist', `document_${Date.now()}.docx`);
    
    try {
        // Vérifier que le template existe
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ error: 'Template non trouvé' });
        }
        
        // Exécuter le script Python pour remplir le template avec en-tête Porteo
        const scriptPath = path.join(__dirname, 'scripts', 'fill_template_with_porteo_header.py');
        const headerTemplatePath = path.join(__dirname, 'public', 'templates', 'PAPIERENTETEPORTEOGROUP2025.docx');
        const jsonData = JSON.stringify(data).replace(/"/g, '\\"');
        const command = `python3.11 "${scriptPath}" "${templatePath}" "${outputPath}" "${jsonData}" "${headerTemplatePath}"`;
        
        console.log('[TEMPLATE] Remplissage du template:', templateFilename);
        await execAsync(command);
        
        // Lire le fichier généré
        const fileBuffer = await readFileAsync(outputPath);
        
        // Nettoyer le fichier temporaire
        await unlinkAsync(outputPath).catch(() => {});
        
        // Envoyer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${templateFilename.replace('.docx', '_rempli.docx')}"`);
        res.send(fileBuffer);
        
        console.log('[TEMPLATE] Document généré avec succès');
    } catch (error) {
        console.error('[TEMPLATE] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la génération du document',
            details: error.message 
        });
    }
});

/**
 * POST /api/generate-blank-document
 * Génère un document Word vierge avec en-tête Porteo
 */
app.post('/api/generate-blank-document', async (req, res) => {
    const { title, content } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Titre et contenu requis' });
    }
    
    const outputPath = path.join(__dirname, 'dist', `document_vierge_${Date.now()}.docx`);
    
    try {
        // Exécuter le script Python pour générer le document vierge
        const scriptPath = path.join(__dirname, 'scripts', 'generate_blank_document.py');
        const headerTemplatePath = path.join(__dirname, 'public', 'templates', 'PAPIERENTETEPORTEOGROUP2025.docx');
        
        // Échapper les arguments pour la ligne de commande
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedContent = content.replace(/"/g, '\\"');
        
        const command = `python3.11 "${scriptPath}" "${escapedTitle}" "${escapedContent}" "${outputPath}" "${headerTemplatePath}"`;
        
        console.log('[BLANK] Génération document vierge:', title);
        await execAsync(command);
        
        // Lire le fichier généré
        const fileBuffer = await readFileAsync(outputPath);
        
        // Nettoyer le fichier temporaire
        await unlinkAsync(outputPath).catch(() => {});
        
        // Envoyer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/[^a-z0-9]/gi, '_')}.docx"`);
        res.send(fileBuffer);
        
        console.log('[BLANK] Document vierge généré avec succès');
    } catch (error) {
        console.error('[BLANK] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la génération du document',
            details: error.message 
        });
    }
});

/**
 * POST /api/generate-report
 * Génère un rapport Word avec en-tête Justicia ou Porteo
 */
app.post('/api/generate-report', async (req, res) => {
    const { data, headerType = 'justicia' } = req.body;
    
    if (!data) {
        return res.status(400).json({ error: 'Les données sont requises' });
    }
    
    const tempJsonPath = path.join(__dirname, `temp_report_${Date.now()}.json`);
    const outputPath = path.join(__dirname, 'dist', `rapport_${Date.now()}.docx`);
    
    try {
        // Écrire les données JSON dans un fichier temporaire
        await writeFileAsync(tempJsonPath, JSON.stringify(data));
        
        // Exécuter le script Python en utilisant le fichier JSON
        const scriptPath = path.join(__dirname, 'scripts', 'generate_report_from_template.py');
        // Utiliser template justicia pour rapports/synthèses, porteo pour documents générés
        const templateType = headerType === 'porteo' ? 'porteo' : 'justicia';
        const command = `python3 "${scriptPath}" "${tempJsonPath}" "${outputPath}" "${templateType}"`;
        
        console.log('[REPORT] Génération du rapport:', headerType);
        await execAsync(command);
        
        // Lire le fichier généré
        const fileBuffer = await readFileAsync(outputPath);
        
        // Nettoyer les fichiers temporaires
        await unlinkAsync(tempJsonPath).catch(() => {});
        await unlinkAsync(outputPath).catch(() => {});
        
        // Envoyer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="rapport_${headerType}.docx"`);
        res.send(fileBuffer);
        
        console.log('[REPORT] Rapport généré avec succès');
    } catch (error) {
        console.error('[REPORT] Erreur:', error);
        
        // Nettoyer en cas d'erreur
        await unlinkAsync(tempJsonPath).catch(() => {});
        await unlinkAsync(outputPath).catch(() => {});
        
        res.status(500).json({ 
            error: 'Erreur lors de la génération du rapport',
            details: error.message 
        });
    }
});

// Configuration multer pour l'upload audio
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Endpoint de transcription audio avec OpenAI Whisper
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier audio fourni' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'Clé API OpenAI non configurée' });
    }

    try {
        console.log('[TRANSCRIBE] Transcription demandée, taille:', req.file.size);
        
        // Créer un FormData pour envoyer à OpenAI
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: 'audio.webm',
            contentType: req.file.mimetype
        });
        formData.append('model', 'whisper-1');
        formData.append('language', 'fr');
        
        // Appeler l'API OpenAI Whisper
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.openai.com',
                port: 443,
                path: '/v1/audio/transcriptions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    ...formData.getHeaders()
                }
            };

            const apiReq = https.request(options, (apiRes) => {
                let data = '';
                apiRes.on('data', chunk => data += chunk);
                apiRes.on('end', () => {
                    if (apiRes.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`API Error: ${apiRes.statusCode} ${data}`));
                    }
                });
            });

            apiReq.on('error', reject);
            formData.pipe(apiReq);
        });
        
        console.log('[TRANSCRIBE] Transcription réussie');
        res.json(response);
        
    } catch (error) {
        console.error('[TRANSCRIBE] Erreur:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la transcription',
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`[SERVER] API de génération de documents Word démarrée sur le port ${PORT}`);
    console.log(`[SERVER] Endpoints: /api/word, /api/generate-docx, /api/tts, /api/chat, /api/brave-search, /api/generate-report, /api/transcribe, /api/fill-template, /api/generate-blank-document`);
});
