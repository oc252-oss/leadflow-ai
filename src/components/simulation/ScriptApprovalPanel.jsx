import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ScriptApprovalPanel({
  assistantId,
  usageType,
  channel,
  systemPrompt,
  greetingMessage,
  tone,
  behaviorRules,
  voiceSettings,
  conversationHistory
}) {
  const [scriptName, setScriptName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedScript, setSavedScript] = useState(null);

  const canSave = scriptName.trim() && usageType && channel;

  const handleSaveAsScript = async () => {
    if (!canSave) {
      toast.error('Preencha nome, tipo de uso e canal');
      return;
    }

    setSaving(true);
    try {
      const response = await base44.functions.invoke('saveSimulationAsScript', {
        assistantId,
        scriptName: scriptName.trim(),
        usageType,
        channel,
        systemPrompt,
        greetingMessage,
        tone,
        behaviorRules,
        voiceSettings: channel === 'voice' ? voiceSettings : null,
        conversationHistory
      });

      if (response.data?.success) {
        setSavedScript(response.data);
        setScriptName('');
        toast.success(`Script salvo como ${response.data.version}!`);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar script');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveScript = async () => {
    if (!savedScript) return;

    setSaving(true);
    try {
      const response = await base44.functions.invoke('approveScript', {
        scriptId: savedScript.scriptId,
        assistantId
      });

      if (response.data?.success) {
        toast.success('Script aprovado e vinculado ao assistente!');
        setSavedScript(null);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aprovar script');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          Salvar como Script Oficial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!savedScript ? (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Nome do Script *</label>
              <Input
                placeholder="Ex: Script Qualificação Dentista"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-600">Tipo de Uso</p>
                <Badge variant={usageType ? 'default' : 'outline'}>{usageType || 'Não definido'}</Badge>
              </div>
              <div>
                <p className="text-slate-600">Canal</p>
                <Badge variant={channel ? 'secondary' : 'outline'}>{channel || 'Não definido'}</Badge>
              </div>
            </div>

            <Button
              onClick={handleSaveAsScript}
              disabled={!canSave || saving}
              className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar como Draft
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-3 p-3 bg-white rounded-lg border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{scriptName}</p>
                  <Badge className="mt-1">{savedScript.version}</Badge>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  {savedScript.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-600">{savedScript.message}</p>
            </div>

            <Button
              onClick={handleApproveScript}
              disabled={saving}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aprovar e Vinculante ao Assistente
            </Button>

            <Button
              onClick={() => setSavedScript(null)}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}