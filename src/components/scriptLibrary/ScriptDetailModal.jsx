import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ScriptDetailModal({ script, open, onOpenChange, onApprove, approving }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!script) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle>{script.name}</DialogTitle>
              <p className="text-sm text-slate-600 mt-2">{script.description}</p>
            </div>
            {script.is_approved && (
              <Badge className="bg-green-500 text-white whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Aprovado
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Versão</p>
              <Badge>{script.version}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Canal</p>
              <Badge variant="outline" className="capitalize">{script.channel}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Tipo de Uso</p>
              <Badge variant="outline">{script.usage_type}</Badge>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Status</p>
              <Badge variant="outline">{script.status}</Badge>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="prompt" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="greeting">Saudação</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="voice">Voz</TabsTrigger>
            </TabsList>

            {/* System Prompt */}
            <TabsContent value="prompt" className="mt-4 space-y-2">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-sm text-slate-900 whitespace-pre-wrap">
                  {script.system_prompt}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(script.system_prompt, 'prompt')}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                {copied === 'prompt' ? 'Copiado!' : 'Copiar'}
              </Button>
            </TabsContent>

            {/* Greeting Message */}
            <TabsContent value="greeting" className="mt-4 space-y-2">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-sm text-indigo-900 italic">
                  "{script.greeting_message || 'Não definida'}"
                </p>
              </div>
              {script.greeting_message && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(script.greeting_message, 'greeting')}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copied === 'greeting' ? 'Copiado!' : 'Copiar'}
                </Button>
              )}
            </TabsContent>

            {/* Behavior Rules */}
            <TabsContent value="behavior" className="mt-4 space-y-3">
              {script.behavior_rules && Object.keys(script.behavior_rules).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(script.behavior_rules).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded border">
                      <span className="text-sm capitalize text-slate-700">{key.replace('_', ' ')}</span>
                      <Badge variant={value ? 'default' : 'outline'}>
                        {value ? 'Ativado' : 'Desativado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Nenhuma regra definida</p>
              )}
            </TabsContent>

            {/* Voice Settings */}
            <TabsContent value="voice" className="mt-4">
              {script.channel === 'voice' && script.voice_settings ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span className="text-sm text-slate-700">Gênero</span>
                    <Badge>{script.voice_settings.gender === 'masculine' ? 'Masculino' : 'Feminino'}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span className="text-sm text-slate-700">Velocidade</span>
                    <Badge>{script.voice_settings.speed}x</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded border">
                    <span className="text-sm text-slate-700">Tom</span>
                    <Badge className="capitalize">{script.voice_settings.tone}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">Não aplicável para este canal</p>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!script.is_approved && (
              <Button
                onClick={() => onApprove(script)}
                disabled={approving}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Aprovar Script
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}