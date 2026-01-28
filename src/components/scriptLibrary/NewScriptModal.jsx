import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function NewScriptModal({ open, onOpenChange, onScriptCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    usage_type: '',
    channel: '',
    system_prompt: '',
    greeting_message: '',
    tone: 'elegante',
    behavior_rules: {},
    voice_settings: {},
    assistant_id: ''
  });
  const [voiceSpeed, setVoiceSpeed] = useState([1.0]);
  const [saving, setSaving] = useState(false);
  const [assistants, setAssistants] = useState([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);

  React.useEffect(() => {
    if (open) {
      loadAssistants();
    }
  }, [open]);

  const loadAssistants = async () => {
    setLoadingAssistants(true);
    try {
      const data = await base44.entities.Assistant.list('-updated_date', 100);
      setAssistants(data);
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
    } finally {
      setLoadingAssistants(false);
    }
  };

  const handleSave = async () => {
    const hasName = formData.name && formData.name.trim().length > 0;
    const hasUsageType = formData.usage_type && formData.usage_type.length > 0;
    const hasChannel = formData.channel && formData.channel.length > 0;
    const hasPrompt = formData.system_prompt && formData.system_prompt.trim().length > 0;

    if (!hasName || !hasUsageType || !hasChannel || !hasPrompt) {
      toast.error('Preencha os campos obrigatórios: Nome, Canal, Tipo e Prompt');
      return;
    }

    setSaving(true);
    try {
      // Determinar versão
      const existingScripts = await base44.asServiceRole.entities.AIScript.filter({
        usage_type: formData.usage_type,
        channel: formData.channel
      });

      let nextVersion = 'v1';
      if (existingScripts && existingScripts.length > 0) {
        const versions = existingScripts
          .map(s => {
            const match = s.version?.match(/v(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(v => v > 0);
        const maxVersion = versions.length > 0 ? Math.max(...versions) : 0;
        nextVersion = `v${maxVersion + 1}`;
      }

      // Criar script
       const newScript = await base44.asServiceRole.entities.AIScript.create({
         assistant_id: formData.assistant_id || null,
        name: formData.name.trim(),
        description: formData.description.trim(),
        usage_type: formData.usage_type,
        channel: formData.channel,
        version: nextVersion,
        system_prompt: formData.system_prompt.trim(),
        greeting_message: formData.greeting_message.trim(),
        tone: formData.tone,
        behavior_rules: formData.behavior_rules,
        voice_settings: formData.channel === 'voice' ? {
          gender: formData.voice_settings.gender || 'feminine',
          speed: voiceSpeed[0],
          tone: formData.voice_settings.tone || 'professional'
        } : null,
        status: 'draft',
        is_approved: false,
        created_from_simulation: false
      });

      toast.success(`Script criado com sucesso (${nextVersion})`);
      onScriptCreated();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar script');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      usage_type: '',
      channel: '',
      system_prompt: '',
      greeting_message: '',
      tone: 'elegante',
      behavior_rules: {},
      voice_settings: {},
      assistant_id: ''
    });
    setVoiceSpeed([1.0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Script</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Nome do Script *</Label>
            <Input
              placeholder="Ex: Script Qualificação Dentista"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {/* Assistente IA */}
           <div>
             <Label className="text-sm font-medium mb-2 block">Assistente IA *</Label>
             <Select value={formData.assistant_id} onValueChange={(value) => setFormData({...formData, assistant_id: value})}>
               <SelectTrigger disabled={loadingAssistants}>
                 <SelectValue placeholder={loadingAssistants ? 'Carregando...' : 'Selecione um assistente'} />
               </SelectTrigger>
               <SelectContent>
                 {assistants.map(assistant => (
                   <SelectItem key={assistant.id} value={assistant.id}>
                     {assistant.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>

           {/* Descrição */}
           <div>
             <Label className="text-sm font-medium mb-2 block">Descrição</Label>
             <Textarea
               placeholder="Descreva o propósito deste script..."
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
               className="h-20"
             />
           </div>

          {/* Canal e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Canal *</Label>
              <Select value={formData.channel} onValueChange={(value) => setFormData({...formData, channel: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="webchat">WebChat</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="voice">Voz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Uso *</Label>
              <Select value={formData.usage_type} onValueChange={(value) => setFormData({...formData, usage_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualificacao">Qualificação</SelectItem>
                  <SelectItem value="reengajamento_7d">Reengajamento 7d</SelectItem>
                  <SelectItem value="reengajamento_30d">Reengajamento 30d</SelectItem>
                  <SelectItem value="reengajamento_90d">Reengajamento 90d</SelectItem>
                  <SelectItem value="prospeccao_ativa">Prospecção Ativa</SelectItem>
                  <SelectItem value="voz_reativacao">Voz - Reativação</SelectItem>
                  <SelectItem value="voz_qualificacao">Voz - Qualificação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tom */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tom de Voz</Label>
            <Select value={formData.tone} onValueChange={(value) => setFormData({...formData, tone: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutro">Neutro</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="elegante">Elegante</SelectItem>
                <SelectItem value="humanizado">Humanizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* System Prompt */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Instrução do Sistema *</Label>
            <Textarea
              placeholder="Defina o comportamento e personalidade da IA..."
              value={formData.system_prompt}
              onChange={(e) => setFormData({...formData, system_prompt: e.target.value})}
              className="h-24"
            />
          </div>

          {/* Greeting Message */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Mensagem de Saudação</Label>
            <Input
              placeholder="Ex: Olá! Como posso ajudar?"
              value={formData.greeting_message}
              onChange={(e) => setFormData({...formData, greeting_message: e.target.value})}
            />
          </div>

          {/* Voice Settings */}
          {formData.channel === 'voice' && (
            <div className="space-y-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm font-medium text-purple-900">Configurações de Voz</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Gênero</Label>
                  <Select 
                    value={formData.voice_settings.gender || 'feminine'} 
                    onValueChange={(value) => setFormData({...formData, voice_settings: {...formData.voice_settings, gender: value}})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminine">Feminina</SelectItem>
                      <SelectItem value="masculine">Masculina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-2 block">Tom</Label>
                  <Select 
                    value={formData.voice_settings.tone || 'professional'} 
                    onValueChange={(value) => setFormData({...formData, voice_settings: {...formData.voice_settings, tone: value}})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutro</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="energetic">Energético</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">
                  Velocidade: {voiceSpeed[0].toFixed(1)}x
                </Label>
                <Slider
                  value={voiceSpeed}
                  onValueChange={setVoiceSpeed}
                  min={0.8}
                  max={1.5}
                  step={0.1}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Criar Script
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}