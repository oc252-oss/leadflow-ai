import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Copy, GitBranch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ScriptActionsModal({ script, open, onOpenChange, action, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reason: ''
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', reason: '' });
  };

  const handleCloneScript = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome do script é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const clonedScript = await base44.asServiceRole.entities.AIScript.create({
        assistant_id: script.assistant_id,
        name: formData.name.trim(),
        description: formData.description.trim() || script.description,
        usage_type: script.usage_type,
        channel: script.channel,
        version: 'v1',
        system_prompt: script.system_prompt,
        greeting_message: script.greeting_message,
        tone: script.tone,
        behavior_rules: script.behavior_rules,
        voice_settings: script.voice_settings,
        status: 'draft',
        is_approved: false,
        created_from_simulation: false
      });

      toast.success(`Script clonado como "${clonedScript.name}"`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao clonar:', error);
      toast.error('Erro ao clonar script');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da versão é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const versionNumber = parseInt(script.version.replace('v', '')) + 1;
      const newVersion = await base44.asServiceRole.entities.AIScript.create({
        assistant_id: script.assistant_id,
        name: formData.name.trim(),
        description: formData.description.trim() || script.description,
        usage_type: script.usage_type,
        channel: script.channel,
        version: `v${versionNumber}`,
        system_prompt: script.system_prompt,
        greeting_message: script.greeting_message,
        tone: script.tone,
        behavior_rules: script.behavior_rules,
        voice_settings: script.voice_settings,
        status: 'draft',
        is_approved: false,
        created_from_simulation: false
      });

      toast.success(`Versão ${newVersion.version} criada`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar versão:', error);
      toast.error('Erro ao criar versão');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    try {
      await base44.asServiceRole.entities.AIScript.update(script.id, {
        status: 'testing',
        reason: formData.reason.trim() || undefined
      });

      toast.success('Script enviado para revisão');
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao enviar para revisão');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectScript = async () => {
    if (!formData.reason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await base44.asServiceRole.entities.AIScript.update(script.id, {
        status: 'draft',
        reason: formData.reason.trim()
      });

      toast.success('Script rejeitado e retornado ao rascunho');
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao rejeitar script');
    } finally {
      setLoading(false);
    }
  };

  if (!script) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'clone' && '📋 Clonar Script'}
            {action === 'version' && '🔀 Criar Versão'}
            {action === 'submit' && '✏️ Enviar para Revisão'}
            {action === 'reject' && '❌ Rejeitar Script'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {action === 'clone' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Clonando:</strong> {script.name} ({script.version})
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nome do Novo Script *</Label>
                <Input
                  placeholder="Ex: Script Qualificação - Versão 2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Descreva as mudanças ou melhorias..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-20"
                />
              </div>
            </>
          )}

          {action === 'version' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Base:</strong> {script.name} ({script.version})
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nome da Nova Versão *</Label>
                <Input
                  placeholder={`Ex: ${script.name} (v${parseInt(script.version.replace('v', '')) + 1})`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>O que foi melhorado?</Label>
                <Textarea
                  placeholder="Descreva as alterações em relação à versão anterior..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="h-20"
                />
              </div>
            </>
          )}

          {action === 'submit' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-900">
                  Enviar <strong>{script.name}</strong> para revisão antes de ser aprovado?
                </p>
              </div>
              <div className="space-y-2">
                <Label>Motivo/Contexto (opcional)</Label>
                <Textarea
                  placeholder="Explique o propósito deste script e qualquer detalhe relevante..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="h-20"
                />
              </div>
            </>
          )}

          {action === 'reject' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-900">
                  Rejeitar <strong>{script.name}</strong>? Será retornado ao rascunho.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Motivo da Rejeição *</Label>
                <Textarea
                  placeholder="Explique por que o script foi rejeitado..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="h-20"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (action === 'clone') handleCloneScript();
                if (action === 'version') handleCreateVersion();
                if (action === 'submit') handleSubmitForReview();
                if (action === 'reject') handleRejectScript();
              }}
              disabled={loading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {action === 'clone' && 'Clonar Script'}
              {action === 'version' && 'Criar Versão'}
              {action === 'submit' && 'Enviar para Revisão'}
              {action === 'reject' && 'Rejeitar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}