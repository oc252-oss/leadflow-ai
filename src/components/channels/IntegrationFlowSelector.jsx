import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from 'lucide-react';

const flowDescriptions = {
  whatsapp: 'Fluxo para boas-vindas e qualificação via WhatsApp',
  instagram: 'Fluxo para respostas rápidas em DMs do Instagram',
  facebook: 'Fluxo para qualificação via Messenger'
};

export default function IntegrationFlowSelector({ 
  flows = [], 
  selectedFlowId, 
  onFlowChange, 
  channelType = 'whatsapp',
  label = 'Fluxo de IA' 
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={selectedFlowId || ''} onValueChange={onFlowChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um fluxo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Nenhum</SelectItem>
          {flows.map(flow => (
            <SelectItem key={flow.id} value={flow.id}>
              {flow.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {flowDescriptions[channelType] && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">{flowDescriptions[channelType]}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}