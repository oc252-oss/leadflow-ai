import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateQRToken() {
  // Gera um token único para o QR code
  const uuid = crypto.randomUUID();
  return uuid.split('-').join('').substring(0, 32);
}

function generateQRCodeSVG(token) {
  // SVG simplificado que representa um QR code
  // Em produção, usar uma lib como qrcode
  const size = 200;
  const padding = 10;
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="white"/>
    <rect x="${padding}" y="${padding}" width="${size - padding * 2}" height="${size - padding * 2}" fill="white" stroke="black" stroke-width="2"/>
    <text x="${size / 2}" y="${size / 2 - 10}" text-anchor="middle" font-size="12" font-family="monospace">${token.substring(0, 8)}</text>
    <text x="${size / 2}" y="${size / 2 + 10}" text-anchor="middle" font-size="12" font-family="monospace">${token.substring(8, 16)}</text>
    <text x="${size / 2}" y="${size / 2 + 30}" text-anchor="middle" font-size="10" fill="#666">MODO TESTE</text>
  </svg>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { channelId } = payload;

    if (!channelId) {
      return Response.json({ error: 'channelId é obrigatório' }, { status: 400 });
    }

    console.log(`[WhatsApp Teste] Gerando QR para canal: ${channelId}`);

    // Verificar se canal existe
    const channels = await base44.entities.WhatsAppChannel.filter({ id: channelId });
    if (!channels || channels.length === 0) {
      return Response.json({ error: 'Canal não encontrado' }, { status: 404 });
    }

    // Gerar token e SVG do QR code
    const token = generateQRToken();
    const svgQR = generateQRCodeSVG(token);
    const base64QR = btoa(svgQR);

    // Salvar QR code no canal
    await base44.asServiceRole.entities.WhatsAppChannel.update(channelId, {
      qr_code: base64QR,
      status: 'pending',
      mode: 'test'
    });

    console.log(`[WhatsApp Teste] QR gerado para ${channelId}`);

    return Response.json({
      qr_code: base64QR,
      status: 'pending',
      token: token,
      message: 'QR Code gerado em modo teste. Clique em "Simular Conexão" para ativar.'
    });
  } catch (error) {
    console.error('[WhatsApp Teste] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});