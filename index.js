const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/generative-ai');
const pino = require('pino');
const http = require('http');

// Configuración de Gemini AI (usará la variable de entorno GEMINI_API_KEY)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot de WhatsApp con Baileys y Gemini AI activo 24/7\n');
});

server.listen(PORT, () => {
    console.log('Servidor HTTP escuchando en el puerto ' + PORT);
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    });

    if (!sock.authState.creds.registered) {
        const phoneNumber = process.env.PHONE_NUMBER;
        if (phoneNumber) {
            setTimeout(async () => {
                try {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log('========================================');
                    console.log('TU CÓDIGO DE VINCULACIÓN ES: ' + code);
                    console.log('========================================');
                } catch (err) {
                    console.log('Error al solicitar código de emparejamiento:', err);
                }
            }, 5000);
        } else {
            console.log('AVISO: Configura la variable de entorno PHONE_NUMBER en Render.');
        }
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada, reconectando...');
            if (shouldReconnect) { connectToWhatsApp(); }
        } else if (connection === 'open') {
            console.log('¡Conectado a WhatsApp exitosamente y listo con Gemini AI!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const senderID = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            
            if (text) {
                console.log('Mensaje recibido de ' + senderID + ': ' + text);
                try {
                    // Generar respuesta inteligente usando Gemini
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: text,
                        config: {
                            systemInstruction: "Eres un asistente virtual administrativo profesional y amable en WhatsApp. Responde de forma concisa y útil."
                        }
                    });

                    const replyText = response.text || "Hola, recibí tu mensaje pero no pude generar una respuesta en este momento.";
                    await sock.sendMessage(senderID, { text: replyText });
                    console.log('Respuesta de IA enviada con éxito.');
                } catch (error) {
                    console.error('Error al generar respuesta con Gemini:', error);
                    await sock.sendMessage(senderID, { text: 'Hola, ocurrió un pequeño error procesando tu mensaje con la IA.' });
                }
            }
        }
    });
}

connectToWhatsApp();
