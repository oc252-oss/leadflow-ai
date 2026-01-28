import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Bot, GitBranch, Zap, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HelpVisualExample from '../components/HelpVisualExample';

const CATEGORIES = [
  {
    id: 'concepts',
    name: 'Conceitos de IA',
    icon: BookOpen,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    description: 'Entenda os fundamentos'
  },
  {
    id: 'assistants',
    name: 'Assistentes',
    icon: Bot,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    description: 'Configure personalidades'
  },
  {
    id: 'flows',
    name: 'Fluxos',
    icon: GitBranch,
    color: 'bg-green-50 border-green-200 text-green-700',
    description: 'Desenhe conversas'
  },
  {
    id: 'voice',
    name: 'Voz',
    icon: Zap,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    description: 'CLINIQ Voice'
  },
  {
    id: 'connections',
    name: 'Conexões',
    icon: Wifi,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    description: 'Canais e integrações'
  }
];

const FAQ = [
  {
    id: 1,
    category: 'concepts',
    question: 'Qual a diferença entre Fluxos de IA, Assistentes de IA e Scripts?',
    answer: `Ótima pergunta! Estes três elementos trabalham juntos mas têm papéis diferentes:

**Fluxo de IA:** Define o *caminho* da conversa. É a estrutura, as etapas, as perguntas feitas e para onde o usuário vai depois. Como um mapa da jornada.

**Assistente de IA:** Define *como falar*. É a personalidade, tom de voz, regras de comportamento e conhecimento específico. Quem é que está conversando?

**Scripts de IA:** Define *o que dizer*. São as mensagens prontas, as respostas padrão e textos usados dentro do fluxo.

**Resumindo:** "Fluxo define o caminho, Assistente define como falar, Script define o que dizer."

**Analogia:** Um fluxo é o roteiro de um filme, o assistente é o ator interpretando, e o script é o texto que ele fala.`,
    searchTerms: ['fluxo', 'assistente', 'script', 'diferença', 'ia']
  },
  {
    id: 2,
    category: 'assistants',
    question: 'Como criar um novo Assistente de IA?',
    answer: `1. Acesse "Assistentes de IA" no menu
2. Clique em "+ Novo Assistente"
3. Preencha:
   - Nome: identifique o assistente
   - Descrição: para que serve
   - Modelo: escolha o LLM
   - Tom: selecione o estilo (profissional, amigável, etc)
4. Configure regras e conhecimento base
5. Clique "Criar"

O assistente fica pronto para ser usado em fluxos.`,
    searchTerms: ['criar', 'novo', 'assistente', 'setup']
  },
  {
    id: 3,
    category: 'flows',
    question: 'O que é um Fluxo de IA?',
    answer: `Um Fluxo de IA é a estrutura da conversa. Define:

- **Mensagens iniciais:** Primeira coisa que o bot diz
- **Etapas:** Perguntas ou ações na sequência
- **Lógica:** Para onde ir baseado na resposta
- **Finalização:** Como encerrar ou transferir para agente

**Exemplo:** Um fluxo para qualificar leads teria:
1. Saudação inicial
2. Pergunta sobre interesse
3. Coleta de informações
4. Agendamento ou transferência`,
    searchTerms: ['fluxo', 'conversa', 'estrutura', 'etapas']
  },
  {
    id: 4,
    category: 'voice',
    question: 'Como funciona CLINIQ Voice?',
    answer: `CLINIQ Voice permite fazer chamadas de voz com IA.

**Características:**
- Chamadas de reengajamento automáticas
- IA fala com naturalidade
- Detecta respostas (sim, não, talvez)
- Integração com leads
- Histórico de chamadas

**Para usar:**
1. Vá para "Campanhas de Voz"
2. Crie uma nova campanha
3. Configure o script
4. Defina o horário
5. Ative a campanha

As chamadas saem automaticamente nos horários configurados.`,
    searchTerms: ['voz', 'voice', 'chamada', 'reengajamento', 'script']
  },
  {
    id: 5,
    category: 'connections',
    question: 'Como conectar WhatsApp?',
    answer: `Para conectar WhatsApp:

1. Vá para "Canais & Integrações"
2. Encontre o card do WhatsApp
3. Clique "Conectar WhatsApp"
4. Um QR Code será gerado
5. Abra WhatsApp no seu celular
6. Vá em "Configurações > Vinculados"
7. Escaneie o QR Code
8. Pronto! WhatsApp conectado

**Importante:** Use um número dedicado para não misturar com conversas pessoais.`,
    searchTerms: ['whatsapp', 'conectar', 'qr', 'integração']
  },
  {
    id: 6,
    category: 'concepts',
    question: 'Como treinar um Assistente de IA?',
    answer: `Você pode treinar seu assistente de duas formas:

**1. Simulação em Chat:**
- Vá para "Simulação & Treinamento"
- Inicie uma chat simulação
- Converse com o bot
- Ajuste comportamentos em tempo real

**2. Simulação em Voz:**
- Use a simulação de voz
- Fale com o bot por voz
- Avalie naturalidade e respostas
- Refine o script

Depois de treinar, salve os ajustes e use em campanhas reais.`,
    searchTerms: ['treinar', 'simulação', 'teste', 'ajustar']
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredFAQ = useMemo(() => {
    return FAQ.filter(item => {
      const matchesSearch = !searchQuery || 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.searchTerms.some(term => term.includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ajuda</h1>
        <p className="text-slate-600 mt-2">Encontre respostas e entenda como usar o sistema</p>
      </div>

      {/* Visual Example */}
      <HelpVisualExample />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="Pesquise suas dúvidas... (ex: 'diferença entre fluxo e assistente')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-6 text-base"
        />
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-3">Categorias</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CATEGORIES.map(category => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(isSelected ? null : category.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? category.color.replace('bg-', 'bg-').replace('border-', 'border-').replace('text-', 'text-')
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-5 h-5 mb-2 mx-auto" />
                <p className="text-xs font-medium">{category.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredFAQ.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Nenhuma dúvida encontrada</p>
            <p className="text-sm text-slate-500 mt-1">Tente outro termo de busca</p>
          </div>
        ) : (
          filteredFAQ.map(item => (
            <Card key={item.id} className="bg-white hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-slate-700">
                  {item.answer.split('\n').map((line, idx) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <p key={idx} className="font-semibold mt-3">
                          {line.replace(/\*\*/g, '')}
                        </p>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={idx} className="ml-4">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.')) {
                      return (
                        <li key={idx} className="ml-4">
                          {line.substring(3)}
                        </li>
                      );
                    }
                    if (line.trim() === '') {
                      return <div key={idx} />;
                    }
                    return (
                      <p key={idx} className="mb-2">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Footer CTA */}
      {filteredFAQ.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
          <p className="text-slate-700">Ainda tem dúvidas?</p>
          <p className="text-sm text-slate-600 mt-1">Envie sua pergunta para nossa equipe de suporte</p>
        </div>
      )}
    </div>
  );
}