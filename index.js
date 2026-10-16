console.log('🚀 Iniciando script del bot...');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('\n--- ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ ¡El Bot está conectado y listo para recibir mensajes!');
});

client.on('message', async (msg) => {
    const texto = msg.body.toLowerCase().trim();
    console.log(`📩 Mensaje recibido: "${msg.body}"`);

    if (texto === 'hola' || texto === 'buenas' || texto === 'inicio') {
        await msg.reply(
            '¡Hola! 👋 Bienvenido a *Actas, CURP y más*.\n\n' +
            'Escribe una opción:\n' +
            '1️⃣ *CATALOGO* (o escribe 1)\n' +
            '2️⃣ *PAGO* (o escribe 2)'
        );
    } 
    else if (texto === 'catalogo' || texto === '1' || texto === '1️⃣') {
        await msg.reply(
            '📦 *Catálogo de Servicios*:\n\n' +
            '• *A* - Trámite de Actas y CURP - Servicio Digital / Local\n\n' +
            '👉 Responde con la letra *A* para recibir tu enlace de pago seguro.'
        );
    } 
    else if (texto === 'a' || texto === 'pago' || texto === '2' || texto === '2️⃣') {
        await msg.reply(
            '💳 *Enlace de Pago - Mercado Pago*:\n\n' +
            'Realiza tu pago seguro aquí:\n' +
            'https://link.mercadopago.com.mx/actasycurp\n\n' +
            '📸 Una vez realizado tu pago, envíanos tu comprobante y los datos necesarios para procesar tu trámite 📄✍️.'
        );
    }
});

console.log('⚙️ Inicializando cliente de WhatsApp...');
client.initialize();
