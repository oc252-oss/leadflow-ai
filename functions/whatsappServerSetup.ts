/**
 * GUIA: Configurar Servidor WhatsApp Externo
 * 
 * Este arquivo documenta como configurar o servidor externo que será consumido pelo Base44.
 * O servidor NÃO é parte do Base44, mas é um serviço separado que roda em outra porta.
 * 
 * ============================================
 * PASSO 1: Criar diretório do servidor
 * ============================================
 * 
 * mkdir whatsapp-server
 * cd whatsapp-server
 * 
 * ============================================
 * PASSO 2: Copiar package.json
 * ============================================
 * 
 * {
 *   "name": "whatsapp-gateway",
 *   "version": "1.0.0",
 *   "description": "WhatsApp Web Gateway using Baileys",
 *   "main": "server.js",
 *   "type": "module",
 *   "scripts": {
 *     "start": "node server.js",
 *     "dev": "node --watch server.js"
 *   },
 *   "dependencies": {
 *     "@whiskeysockets/baileys": "^6.4.0",
 *     "express": "^4.18.2",
 *     "qrcode": "^1.5.3",
 *     "pino": "^8.16.2",
 *     "pino-pretty": "^10.3.1"
 *   }
 * }
 * 
 * ============================================
 * PASSO 3: Instalar dependências
 * ============================================
 * 
 * npm install
 * 
 * ============================================
 * PASSO 4: Copiar server.js (ver documento separado)
 * ============================================
 * 
 * ============================================
 * PASSO 5: Rodar servidor
 * ============================================
 * 
 * npm start
 * 
 * Vai rodar em: http://localhost:3000
 * 
 * ============================================
 * PASSO 6: Configurar URL no Base44
 * ============================================
 * 
 * Ir para Settings > Environment Variables
 * Adicionar ou atualizar:
 * 
 * WHATSAPP_SERVER_URL = http://localhost:3000
 * (ou IP/domínio onde o servidor está rodando)
 * 
 * ============================================
 * ENDPOINTS DISPONÍVEIS
 * ============================================
 * 
 * POST /whatsapp/connect
 * GET /whatsapp/qrcode/:channelId
 * POST /whatsapp/send-message
 * GET /whatsapp/status/:channelId
 * POST /whatsapp/disconnect/:channelId
 * GET /health
 * 
 * ============================================
 * NOTAS IMPORTANTES
 * ============================================
 * 
 * 1. O servidor roda FORA do Base44
 * 2. Base44 faz chamadas HTTP para este servidor
 * 3. Sessões são persistidas localmente em sessions/
 * 4. QR Code é REAL (gerado pelo Baileys)
 * 5. Suporta múltiplos canais simultâneos
 * 6. Sem autenticação (MVP)
 */

Deno.serve(async (req) => {
  return Response.json({
    message: 'Servidor WhatsApp externo não é parte do Base44. Veja comentários neste arquivo.'
  });
});