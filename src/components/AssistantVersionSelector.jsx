import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

export default function AssistantVersionSelector({ assistantId, value, onChange }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assistantId) {
      loadVersions();
    }
  }, [assistantId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.AssistantVersion.filter({
        assistant_id: assistantId
      }, '-version_number');
      setVersions(data);
    } catch (error) {
      console.error('Error loading versions:', error);
      toast.error('Erro ao carregar versões');
    } finally {
      setLoading(false);
    }
  };

  const activeVersion = versions.find(v => v.is_active);

  return (
    <Select value={value} onValueChange={onChange} disabled={loading || versions.length === 0}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione uma versão" />
      </SelectTrigger>
      <SelectContent>
        {versions.length === 0 ? (
          <div className="p-2 text-sm text-slate-500">Nenhuma versão disponível</div>
        ) : (
          versions.map(version => (
            <SelectItem key={version.id} value={version.id}>
              <div className="flex items-center gap-2">
                <span>Versão {version.version_number}</span>
                {version.is_active && <Badge className="bg-green-100 text-green-700 text-xs">Ativa</Badge>}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}