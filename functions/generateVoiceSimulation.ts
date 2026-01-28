import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      assistantId,
      callType,
      leadName,
      leadProfile,
      systemPrompt,
      voiceSettings
    } = payload;

    if (!assistantId || !callType || !leadName) {
      return Response.json({
        error: 'Parâmetros obrigatórios: assistantId, callType, leadName'
      }, { status: 400 });
    }

    console.log(`[Voz] Gerando simulação de ligação para ${leadName}`);

    // Construir prompt para gerar script de ligação
    const callTypeDescriptions = {
      qualificacao: 'qualificar um lead novo sobre interesse em serviços',
      reengajamento: 'reengajar um cliente que não interage há tempo',
      prospeccao: 'prospectar e conquistar um novo cliente'
    };

    const voicePrompt = `${systemPrompt || 'Você é um agente de vendas profissional.'}

Contexto da ligação:
- Tipo: ${callTypeDescriptions[callType]}
- Lead: ${leadName}
- Perfil: ${leadProfile || 'Cliente em geral'}

Gere um script de ligação natural e convincente com as seguintes características:
1. Saudação inicial
2. Apresentação e motivo da ligação
3. Perguntas qualificadoras
4. Proposta de valor
5. Fechamento/CTA

Formato esperado: Cada fala em uma linha separada, iniciando com "IA:" ou "LEAD:". Mantenha as falas curtas e naturais, como em uma conversa real.`;

    // Invocar LLM para gerar script
    const scriptResponse = await base44.integrations.Core.InvokeLLM({
      prompt: voicePrompt,
      add_context_from_internet: false
    });

    // Parsear script em falas individuais
    const lines = scriptResponse.split('\n').filter(line => line.trim());
    const speeches = [];

    lines.forEach((line, idx) => {
      if (line.startsWith('IA:')) {
        speeches.push({
          sequence: speeches.length,
          speaker: 'ai',
          text: line.replace('IA:', '').trim(),
          audioUrl: null, // Será gerado via TTS
          duration: 0
        });
      } else if (line.startsWith('LEAD:')) {
        speeches.push({
          sequence: speeches.length,
          speaker: 'lead',
          text: line.replace('LEAD:', '').trim(),
          audioUrl: null,
          duration: 0
        });
      }
    });

    console.log(`[Voz] Script gerado com ${speeches.length} falas`);

    return Response.json({
      success: true,
      script: speeches,
      callType,
      leadName,
      voiceSettings,
      totalSpeeches: speeches.length,
      message: 'Script de simulação gerado com sucesso'
    });
  } catch (error) {
    console.error('[Voz] Erro:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});