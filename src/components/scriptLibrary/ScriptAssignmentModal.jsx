import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ScriptAssignmentModal({ script, open, onOpenChange, onAssign, assigning }) {
  const [assistants, setAssistants] = useState([]);
  const [selectedAssistant, setSelectedAssistant] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAssistants();
    }
  }, [open]);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Assistant.list('-updated_date', 100);
      setAssistants(data || []);
    } catch (error) {
      console.error('Erro ao carregar assistentes:', error);
      toast.error('Erro ao carregar assistentes');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssistant) {
      toast.error('Selecione um assistente');
      return;
    }

    await onAssign(script, selectedAssistant);
    setSelectedAssistant('');
  };

  const compatibleAssistants = assistants.filter(a => a.channel === script?.channel);

  if (!script) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Vincular Script a Assistente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Script Info */}
          <div className="p-3 rounded-lg bg-slate-50 border">
            <p className="text-xs text-slate-600 mb-1">Script</p>
            <p className="font-medium text-slate-900">{script.name}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="capitalize">{script.channel}</Badge>
              <Badge variant="outline">{script.version}</Badge>
            </div>
          </div>

          {/* Compatibilidade */}
          {compatibleAssistants.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-900">
                Nenhum assistente de canal <strong>{script.channel}</strong> disponível.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Selecione o Assistente ({compatibleAssistants.length} disponível{compatibleAssistants.length !== 1 ? 's' : ''})
                </label>
                <Select value={selectedAssistant} onValueChange={setSelectedAssistant} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um assistente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleAssistants.map(asst => (
                      <SelectItem key={asst.id} value={asst.id}>
                        {asst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAssistant && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-900">
                    ✓ Este script será usado como padrão para o assistente selecionado em produção.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleAssign}
              disabled={!selectedAssistant || assigning || loading || compatibleAssistants.length === 0}
              className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Vincular
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}