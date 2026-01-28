import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Bot, FileText, ArrowRight, MessageCircle } from 'lucide-react';

export default function HelpVisualExample() {
  const flowSteps = [
    { num: 1, title: 'Boas-vindas', msg: '"Olá! Que bom falar com você 😊"' },
    { num: 2, title: 'Identificar interesse', msg: '"Você entrou por qual procedimento?"' },
    { num: 3, title: 'Classificar urgência', msg: '"Está em breve ou pesquisando?"' },
    { num: 4, title: 'Convite avaliação', msg: '"Podemos agendar uma avaliação?"' },
    { num: 5, title: 'Encaminhar', msg: 'Transfere para consultora' }
  ];

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-6 rounded-lg border border-indigo-200">
        <p className="text-sm font-semibold text-indigo-900 mb-2">EXEMPLO PRÁTICO</p>
        <h3 className="text-lg font-bold text-slate-900">Como tudo se conecta no CLINIQ.AI</h3>
        <p className="text-sm text-slate-700 mt-2">Cenário: Royal Face recebe leads no WhatsApp e qualifica para avaliação</p>
      </div>

      {/* Main Flow */}
      <div className="space-y-6">
        {/* Fluxo Card */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-green-700" />
              <div>
                <CardTitle className="text-base">1️⃣ FLUXO DE IA (O CAMINHO)</CardTitle>
                <p className="text-xs text-slate-600 mt-1">Define a ordem e lógica da conversa</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Qualificação + Convite para Avaliação</p>
              <div className="space-y-2 mt-3">
                {flowSteps.map((step, idx) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                        {step.num}
                      </div>
                      {idx < flowSteps.length - 1 && (
                        <div className="w-0.5 h-8 bg-green-300 ml-3" />
                      )}
                    </div>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-600">{step.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-slate-500">
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs font-medium">executado por</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Assistente Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-700" />
              <div>
                <CardTitle className="text-base">2️⃣ ASSISTENTE DE IA (QUEM FALA)</CardTitle>
                <p className="text-xs text-slate-600 mt-1">Executa o fluxo com personalidade</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Letícia – WhatsApp Royal Face</p>
              <p className="text-xs text-slate-600 mt-1">Canal: WhatsApp</p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200 space-y-2">
              <p className="text-xs font-medium text-slate-900">Personalidade:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">Elegante</Badge>
                <Badge variant="outline" className="text-xs">Humanizada</Badge>
                <Badge variant="outline" className="text-xs">Clara</Badge>
                <Badge variant="outline" className="text-xs">Comercial</Badge>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200 space-y-2">
              <p className="text-xs font-medium text-slate-900">Regras:</p>
              <ul className="text-xs text-slate-700 space-y-1">
                <li>❌ Não falar preços</li>
                <li>✅ Priorizar avaliação</li>
                <li>✅ Linguagem feminina</li>
                <li>✅ Respeitar horário</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Arrow */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-slate-500">
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs font-medium">usa respostas de</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Scripts Card */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-700" />
              <div>
                <CardTitle className="text-base">3️⃣ SCRIPTS DE IA (O QUE DIZER)</CardTitle>
                <p className="text-xs text-slate-600 mt-1">Respostas prontas para situações-chave</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs font-semibold text-purple-900">Script – Objeção "Vou pensar"</p>
              <p className="text-xs text-slate-700 mt-2 italic">"Claro 😊 Fique à vontade. A avaliação é justamente para esclarecer tudo com tranquilidade."</p>
            </div>
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs font-semibold text-purple-900">Script – Convite Avaliação</p>
              <p className="text-xs text-slate-700 mt-2 italic">"Nossa avaliação é um momento para entender seu caso e indicar o melhor caminho 💙"</p>
            </div>
            <div className="bg-white p-3 rounded border border-purple-200">
              <p className="text-xs font-semibold text-purple-900">Script – Reengajamento 7 dias</p>
              <p className="text-xs text-slate-700 mt-2 italic">"Oi! Passando para saber se você conseguiu pensar sobre sua avaliação 😊"</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visão Final */}
      <div className="bg-slate-900 text-white p-6 rounded-lg space-y-4">
        <p className="text-sm font-semibold">🧠 NA PRÁTICA</p>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-4 h-4 mt-1 flex-shrink-0" />
            <p className="text-sm">Lead entra no WhatsApp</p>
          </div>
          <div className="flex items-start gap-3 ml-2">
            <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-indigo-400" />
          </div>
          <div className="flex items-start gap-3">
            <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
            <p className="text-sm"><strong>Assistente Letícia</strong> responde</p>
          </div>
          <div className="flex items-start gap-3 ml-2">
            <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-indigo-400" />
          </div>
          <div className="flex items-start gap-3">
            <GitBranch className="w-4 h-4 mt-1 flex-shrink-0" />
            <p className="text-sm"><strong>Fluxo de Qualificação</strong> define o caminho</p>
          </div>
          <div className="flex items-start gap-3 ml-2">
            <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-indigo-400" />
          </div>
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 mt-1 flex-shrink-0" />
            <p className="text-sm"><strong>Scripts</strong> fornecem respostas para objeções</p>
          </div>
          <div className="flex items-start gap-3 ml-2">
            <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0 text-indigo-400" />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 mt-1 flex-shrink-0 text-green-400">✓</div>
            <p className="text-sm"><strong>Lead qualificado</strong> e convidado para avaliação</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
        <p className="text-sm text-slate-900">
          <span className="font-semibold">Resumindo:</span> O <strong>Fluxo</strong> define o caminho, o <strong>Assistente</strong> define como falar, o <strong>Script</strong> define o que dizer.
        </p>
      </div>
    </div>
  );
}