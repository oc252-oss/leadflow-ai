import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdjustmentsPanel({ assistant, onSave }) {
  const [edits, setEdits] = useState({
    system_prompt: assistant?.system_prompt || '',
    greeting_message: assistant?.greeting_message || '',
    behavior_rules: assistant?.behavior_rules || {}
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(edits);
      toast.success('Ajustes salvos com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar ajustes');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEdits({
      system_prompt: assistant?.system_prompt || '',
      greeting_message: assistant?.greeting_message || '',
      behavior_rules: assistant?.behavior_rules || {}
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ajustes em Tempo Real</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Prompt */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Prompt do Sistema</Label>
          <Textarea
            placeholder="Instruções principais para o IA..."
            value={edits.system_prompt}
            onChange={(e) => setEdits({...edits, system_prompt: e.target.value})}
            className="h-24"
          />
        </div>

        {/* Greeting Message */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Mensagem de Saudação</Label>
          <Textarea
            placeholder="Primeira mensagem que o IA enviará..."
            value={edits.greeting_message}
            onChange={(e) => setEdits({...edits, greeting_message: e.target.value})}
            className="h-20"
          />
        </div>

        {/* Behavior Rules */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Regras de Comportamento</Label>
          <div className="space-y-2">
            {Object.entries(edits.behavior_rules || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-2 rounded-lg border">
                <Label className="text-sm capitalize">{key.replace('_', ' ')}</Label>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => 
                    setEdits({
                      ...edits,
                      behavior_rules: {...edits.behavior_rules, [key]: checked}
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}