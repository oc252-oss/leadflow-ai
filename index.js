import express from 'express'
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import fs from 'fs'

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

let sock = null
let lastQr = null
let connectionStatus = 'idle'

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update

    if (qr) {
      lastQr = await QRCode.toDataURL(qr)
      connectionStatus = 'qr'
      console.log('📲 QR Code gerado')
    }

    if (connection === 'open') {
      connectionStatus = 'connected'
      lastQr = null
      console.log('✅ WhatsApp conectado com sucesso')
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      console.log('⚠️ WhatsApp desconectado')

      if (shouldReconnect) {
        connectionStatus = 'reconnecting'
        startWhatsApp()
      } else {
        connectionStatus = 'logged_out'
      }
    }
  })
}

/**
 * Endpoint que o Base44 vai chamar
 * GET /connect
 */
app.get('/connect', async (req, res) => {
  if (!sock) {
    console.log('🚀 Iniciando sessão WhatsApp')
    await startWhatsApp()
  }

  res.json({
    status: connectionStatus,
    qr_code: lastQr
  })
})

/**
 * Health check (IMPORTANTE PARA O RENDER)
 */
app.get('/', (req, res) => {
  res.send('WhatsApp Server ONLINE')
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`)
})
