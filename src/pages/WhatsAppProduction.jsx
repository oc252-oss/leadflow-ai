import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Phone, Settings } from 'lucide-react';
import WhatsAppWebSetup from '../components/integration/WhatsAppWebSetup';

export default function WhatsAppProduction() {
  const [activeTab, setActiveTab] = useState('setup');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">WhatsApp Real — Produção</h1>
        <p className="text-slate-600 mt-2">Conexão com WhatsApp oficial para atendimento automático</p>
      </div>

      {/* Aviso Crítico */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-red-900">⚠️ Ambiente de Produção</p>
            <p className="text-sm text-red-700">
              Esta não é uma simulação. Toda mensagem recebida:
            </p>
            <ul className="text-sm text-red-700 space-y-1 ml-4 list-disc">
              <li>Cria um Lead real na base de dados</li>
              <li>Cria uma Conversa real</li>
              <li>Envia respostas reais para o WhatsApp</li>
              <li>Gera logs e histórico permanente</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">
            <Phone className="w-4 h-4 mr-2" />
            Conectar WhatsApp
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-6">
          <WhatsAppWebSetup />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Produção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-700">
                  Configurações de resposta automática, horários, assistentes padrão e regras de roteamento virão aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}