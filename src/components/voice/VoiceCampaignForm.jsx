import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function VoiceCampaignForm({ campaign, onSave, onCancel, teamMembers = [], company }) {
  const [data, setData] = useState(campaign || {
    name: '',
    description: '',
    inactivity_days: 7,
    script_text: '',
    lead_sources: [],
    exclude_do_not_contact: true,
    exclude_open_tasks: false,
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    calling_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    max_attempts_per_lead: 1,
    assigned_to_type: 'queue',
    assigned_to_user_id: null,
    is_active: false
  });

  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = async (activate = false) => {
    if (!data.name || !data.script_text) {
      alert('Nome e script são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...data, is_active: activate || data.is_active });
    } finally {
      setSaving(false);
    }
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Segunda',
    tuesday: 'Terça',
    wednesday: 'Quarta',
    thursday: 'Quinta',
    friday: 'Sexta',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  const leadSources = ['Facebook', 'WhatsApp', 'Imported'];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* SECTION 1: GENERAL INFORMATION */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Informações Gerais</h3>
        
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome da Campanha*</Label>
          <Input
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Reengajamento Março"
          />
        </div>

        <div className="space-y-2">
          <Label>Dias Inatividade*</Label>
          <Select value={String(data.inactivity_days)} onValueChange={(val) => setData({ ...data, inactivity_days: parseInt(val) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="col-span-2 space-y-2">
        <Label>Descrição</Label>
        <Input
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Descrição opcional"
        />
      </div>

      <div className="col-span-2 space-y-2">
        <Label>Tipo de Campanha</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="campaign_type" value="reengagement" defaultChecked className="w-4 h-4" />
            <span className="text-sm text-slate-700">Reengajamento</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer opacity-50">
            <input type="radio" name="campaign_type" value="prospecting" disabled className="w-4 h-4" />
            <span className="text-sm text-slate-700">Prospecting <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Em Breve</span></span>
          </label>
        </div>
      </div>
      </div>

      {/* SECTION 2: LEAD SELECTION */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Seleção de Leads</h3>
        
        <div className="space-y-2">
          <Label>Período de Inatividade*</Label>
          <Select value={String(data.inactivity_days)} onValueChange={(val) => setData({ ...data, inactivity_days: parseInt(val) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Fontes de Lead</Label>
          <div className="space-y-2">
            {leadSources.map(source => (
              <label key={source} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={data.lead_sources.includes(source)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setData({ ...data, lead_sources: [...data.lead_sources, source] });
                    } else {
                      setData({ ...data, lead_sources: data.lead_sources.filter(s => s !== source) });
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">{source}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Exclusões</Label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.exclude_do_not_contact}
              onCheckedChange={(checked) => setData({ ...data, exclude_do_not_contact: checked })}
            />
            <span className="text-sm text-slate-700">Excluir leads marcados como "Não Contatar"</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.exclude_open_tasks}
              onCheckedChange={(checked) => setData({ ...data, exclude_open_tasks: checked })}
            />
            <span className="text-sm text-slate-700">Excluir leads com tarefas abertas</span>
          </label>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <span className="font-medium">Aproximadamente: </span>
            Esta campanha atingirá aproximadamente <strong>X leads</strong> baseado nos critérios acima.
          </p>
        </div>
      </div>

      {/* SECTION 3: VOICE SCRIPT */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Script de Voz</h3>
        
      <div className="space-y-2">
        <Label>Texto do Script*</Label>
        <Textarea
          value={data.script_text}
          onChange={(e) => setData({ ...data, script_text: e.target.value })}
          placeholder="Olá, tudo bem? Estou ligando da clínica..."
          className="min-h-32"
        />
        <p className="text-xs text-slate-500">Use frases curtas e linguagem natural. Este texto será falado pela IA durante a chamada.</p>
      </div>
      </div>

      {/* SECTION 4: ASSIGNMENT RULE */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Regra de Atribuição</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" style={{ borderColor: data.assigned_to_type === 'specific' ? '#4f46e5' : '#e2e8f0' }}>
            <input 
              type="radio" 
              name="assignment" 
              value="specific"
              checked={data.assigned_to_type === 'specific'}
              onChange={() => setData({ ...data, assigned_to_type: 'specific' })}
              className="w-4 h-4"
            />
            <div>
              <p className="font-medium text-sm text-slate-900">Assistente Específico</p>
              <p className="text-xs text-slate-500">Atribuir leads interessados a um membro da equipe</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" style={{ borderColor: data.assigned_to_type === 'queue' ? '#4f46e5' : '#e2e8f0' }}>
            <input 
              type="radio" 
              name="assignment" 
              value="queue"
              checked={data.assigned_to_type === 'queue'}
              onChange={() => setData({ ...data, assigned_to_type: 'queue', assigned_to_user_id: null })}
              className="w-4 h-4"
            />
            <div>
              <p className="font-medium text-sm text-slate-900">Fila da Clínica</p>
              <p className="text-xs text-slate-500">Tarefas visíveis para toda a equipe de atendimento</p>
            </div>
          </label>
        </div>

        {data.assigned_to_type === 'specific' && (
          <div className="space-y-2 ml-7">
            <Label>Selecionar Assistente</Label>
            <Select value={data.assigned_to_user_id || ''} onValueChange={(val) => setData({ ...data, assigned_to_user_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um membro" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* SECTION 5: ADVANCED COMPLIANCE */}
      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-slate-900">Horários e Segurança</h3>
          <svg className={cn(
            "w-5 h-5 text-slate-600 transition-transform",
            showAdvanced && "rotate-180"
          )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início do Horário</Label>
                <Input
                  type="time"
                  value={data.business_hours_start}
                  onChange={(e) => setData({ ...data, business_hours_start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Fim do Horário</Label>
                <Input
                  type="time"
                  value={data.business_hours_end}
                  onChange={(e) => setData({ ...data, business_hours_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dias para Ligar</Label>
              <div className="grid grid-cols-4 gap-3">
                {days.map(day => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.calling_days.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setData({
                            ...data,
                            calling_days: [...data.calling_days, day]
                          });
                        } else {
                          setData({
                            ...data,
                            calling_days: data.calling_days.filter(d => d !== day)
                          });
                        }
                      }}
                    />
                    <span className="text-xs text-slate-700">{dayLabels[day]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Máximo de Tentativas por Lead</Label>
              <Select value={String(data.max_attempts_per_lead)} onValueChange={(val) => setData({ ...data, max_attempts_per_lead: parseInt(val) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="2">2 tentativas</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Se a Chamada Não Atender</Label>
              <p className="text-sm text-slate-600">Não repetir (padrão recomendado)</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving} className="bg-slate-600 hover:bg-slate-700">
          {saving ? 'Salvando...' : 'Salvar Campanha'}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Ativando...' : 'Salvar e Ativar'}
        </Button>
      </div>
    </div>
  );
}