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
    type: 'reengagement',
    days_inactive: 7,
    script: '',
    lead_sources: [],
    exclude_do_not_contact: true,
    exclude_open_tasks: false,
    allowed_hours_start: '09:00',
    allowed_hours_end: '18:00',
    allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    max_attempts: 1,
    assigned_to_type: 'queue',
    assigned_to_user_id: null,
    is_active: false
  });

  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSave = async (activate = false) => {
    if (!data.name || !data.script) {
      alert('Nome e script são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await onSave({ 
        ...data, 
        is_active: activate,
        status: activate ? 'active' : 'draft'
      });
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
        <h3 className="font-semibold text-slate-900">Informações da Campanha</h3>
        
      <div className="space-y-2">
        <Label>Nome da Campanha*</Label>
        <Input
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="Ex: Reengajamento de leads – 7 dias"
        />
        <p className="text-xs text-slate-500">Use um nome que facilite a identificação dessa campanha no dia a dia.</p>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Descrição opcional"
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Campanha</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 bg-blue-50 border-blue-300">
            <input type="radio" name="campaign_type" value="reengagement" defaultChecked className="w-4 h-4" />
            <div>
              <p className="font-medium text-sm text-slate-900">Reengajamento de Leads</p>
              <p className="text-xs text-slate-500">Para leads que já tiveram contato com a clínica</p>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer opacity-50">
            <input type="radio" name="campaign_type" value="prospecting" disabled className="w-4 h-4" />
            <div>
              <p className="font-medium text-sm text-slate-900">Prospecção Ativa <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-2">Em Breve</span></p>
              <p className="text-xs text-slate-500">No momento, as campanhas de voz são para reengajar leads</p>
            </div>
          </label>
        </div>
      </div>
      </div>

      {/* SECTION 2: LEAD SELECTION - FUNNEL BASED */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Quem a IA vai Ligar</h3>
        
        <div className="space-y-2">
          <Label>Etapas do Funil*</Label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={data.target_funnel_stages?.includes('Atendimento Iniciado')}
                onCheckedChange={(checked) => {
                  const stages = data.target_funnel_stages || ['Atendimento Iniciado', 'Qualificado'];
                  if (checked) {
                    setData({ ...data, target_funnel_stages: [...stages.filter(s => s !== 'Atendimento Iniciado'), 'Atendimento Iniciado'] });
                  } else {
                    setData({ ...data, target_funnel_stages: stages.filter(s => s !== 'Atendimento Iniciado') });
                  }
                }}
              />
              <span className="text-sm font-medium text-slate-900">Atendimento Iniciado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={data.target_funnel_stages?.includes('Qualificado')}
                onCheckedChange={(checked) => {
                  const stages = data.target_funnel_stages || ['Atendimento Iniciado', 'Qualificado'];
                  if (checked) {
                    setData({ ...data, target_funnel_stages: [...stages.filter(s => s !== 'Qualificado'), 'Qualificado'] });
                  } else {
                    setData({ ...data, target_funnel_stages: stages.filter(s => s !== 'Qualificado') });
                  }
                }}
              />
              <span className="text-sm font-medium text-slate-900">Qualificado</span>
            </label>
          </div>
          <p className="text-xs text-slate-500">Selecione em quais etapas do funil os leads estão parados.</p>
        </div>

        <div className="space-y-2">
          <Label>Leads Sem Interação Há*</Label>
          <Select value={String(data.days_inactive)} onValueChange={(val) => setData({ ...data, days_inactive: parseInt(val) })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">A IA entrará em contato com leads que não responderam dentro desse período.</p>
        </div>

        <div className="space-y-2">
          <Label>Origem dos Leads (opcional)</Label>
          <div className="space-y-2">
            {leadSources.map(source => (
              <label key={source} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={data.lead_sources?.includes(source)}
                  onChange={(e) => {
                    const sources = data.lead_sources || [];
                    if (e.target.checked) {
                      setData({ ...data, lead_sources: [...sources, source] });
                    } else {
                      setData({ ...data, lead_sources: sources.filter(s => s !== source) });
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-700">{source}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">Deixe em branco para incluir todos.</p>
        </div>

        <div className="space-y-2">
          <Label>Exclusões Automáticas</Label>
          <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-lg hover:bg-slate-50 bg-blue-50 border-blue-300">
            <Checkbox
              checked={data.exclude_open_tasks !== false}
              onCheckedChange={(checked) => setData({ ...data, exclude_open_tasks: checked })}
            />
            <span className="text-sm text-slate-700 font-medium">Leads que já possuem tarefa em andamento</span>
          </label>
          <p className="text-xs text-slate-500">Evita contatos repetidos e melhora a experiência do paciente.</p>
        </div>

        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-sm text-indigo-900">
            ⚡ <span className="font-medium">A campanha usa o funil central de vendas para identificar leads parados.</span>
          </p>
        </div>
      </div>

      {/* SECTION 3: VOICE SCRIPT */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">O Que a IA vai Falar</h3>
        
      <div className="space-y-2">
        <Label>Mensagem da Ligação*</Label>
        <Textarea
          value={data.script}
          onChange={(e) => setData({ ...data, script: e.target.value })}
          placeholder="Olá, tudo bem?
Aqui é a assistente virtual da Royal Face Ji-Paraná.

Você teve contato conosco recentemente e estou ligando para saber se posso te ajudar a agendar uma avaliação estética sem custo.

Posso seguir?"
          className="min-h-32"
        />
        <p className="text-xs text-slate-500">Use frases curtas e linguagem natural. Essa mensagem será falada pela IA durante a ligação.</p>
      </div>
      </div>

      {/* SECTION 4: ASSIGNMENT RULE */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-slate-900">Destino do Interesse</h3>
        <p className="text-sm text-slate-600 mb-3">Para quem a tarefa deve ser direcionada?</p>
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
              <p className="font-medium text-sm text-slate-900">Assistente Específica</p>
              <p className="text-xs text-slate-500">Atribuir aos leads interessados a um membro</p>
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
              <p className="text-xs text-slate-500">Tarefas visíveis para toda a equipe</p>
            </div>
          </label>
        </div>

        {data.assigned_to_type === 'specific' && (
          <div className="space-y-2 ml-7">
            <Label>Selecione a Pessoa Responsável</Label>
            <Select value={data.assigned_to_user_id || ''} onValueChange={(val) => setData({ ...data, assigned_to_user_id: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um assistente" />
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
        <p className="text-xs text-slate-500 mt-3">Isso ajuda a organizar o fluxo e evita perda de oportunidades.</p>
      </div>

      {/* SECTION 5: COMPLIANCE & SAFETY */}
      <div className="space-y-4 border rounded-lg p-4 bg-slate-50">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full"
        >
          <h3 className="font-semibold text-slate-900">Regras e Horários da Campanha</h3>
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
                <Label>Das</Label>
                <Input
                  type="time"
                  value={data.allowed_hours_start}
                  onChange={(e) => setData({ ...data, allowed_hours_start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Até</Label>
                <Input
                  type="time"
                  value={data.allowed_hours_end}
                  onChange={(e) => setData({ ...data, allowed_hours_end: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">As ligações só serão realizadas dentro desse período.</p>

            <div className="space-y-3">
              <Label>Dias da Semana Permitidos</Label>
              <div className="grid grid-cols-4 gap-3">
                {days.map(day => (
                  <label key={day} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.allowed_days.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setData({
                            ...data,
                            allowed_days: [...data.allowed_days, day]
                          });
                        } else {
                          setData({
                            ...data,
                            allowed_days: data.allowed_days.filter(d => d !== day)
                          });
                        }
                      }}
                    />
                    <span className="text-xs text-slate-700">{dayLabels[day]}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-slate-500">Respeitar os dias úteis melhora a taxa de resposta e evita incômodos.</p>
            </div>

            <div className="space-y-2">
              <Label>Tentativas por Lead</Label>
              <Select value={String(data.max_attempts)} onValueChange={(val) => setData({ ...data, max_attempts: parseInt(val) })}>
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
              <p className="text-xs text-slate-500">Para o MVP, recomendamos apenas uma tentativa por lead.</p>
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
          {saving ? 'Ativando...' : 'Salvar e Ativar Campanha'}
        </Button>
      </div>
      
      <p className="text-xs text-slate-500 text-center pt-2">
        Você pode pausar ou editar essa campanha a qualquer momento.
      </p>
    </div>
  );
}