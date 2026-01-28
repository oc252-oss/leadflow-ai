import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateQRToken() {
  // Gera um token único para o QR code
  const uuid = crypto.randomUUID();
  return uuid.split('-').join('').substring(0, 32);
}

function generateQRCodeSVG(token) {
  const size = 200;
  const padding = 20;
  const blockSize = 8;
  
  // Gerar padrão pseudo-QR baseado no token
  let pattern = '';
  const tokenHash = token.split('').reduce((a, b) => {
    const num = a + b.charCodeAt(0);
    return ((num << 5) - num) + b.charCodeAt(0);
  }, 0);
  
  const seed = Math.abs(tokenHash);
  const blocks = Math.floor((size - padding * 2) / blockSize);
  
  for (let y = 0; y < blocks; y++) {
    for (let x = 0; x < blocks; x++) {
      const idx = (y * blocks + x) % 32;
      const bit = (seed >> idx) & 1;
      if (bit) {
        pattern += `<rect x="${padding + x * blockSize}" y="${padding + y * blockSize}" width="${blockSize - 1}" height="${blockSize - 1}" fill="black"/>`;
      }
    }
  }
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="white"/>
    ${pattern}
    <text x="${size / 2}" y="${size - 10}" text-anchor="middle" font-size="10" fill="#666">TESTE</text>
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