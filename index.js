import express from 'express';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

let sock;
let lastQr = null;

// Inicializa WhatsApp
async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { qr, connection } = update;

    if (qr) {
      lastQr = await QRCode.toDataURL(qr);
      console.log('QR Code atualizado');
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp conectado');
    }

    if (connection === 'close') {
      console.log('⚠️ WhatsApp desconectado, reiniciando...');
      startWhatsApp();
    }
  });
}

// Endpoint de teste (Render exige isso)
app.get('/', (req, res) => {
  res.send('Servidor WhatsApp ativo');
});

// Endpoint para o Base44 buscar o QR Code
app.get('/connect', async (req, res) => {
  if (!sock) {
    await startWhatsApp();
  }

  res.json({
    status: lastQr ? 'qr_ready' : 'waiting_qr',
    qr_code: lastQr
  });
});

// 🚨 OBRIGATÓRIO PARA O RENDER
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  startWhatsApp();
});
