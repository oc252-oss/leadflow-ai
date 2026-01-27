import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function VoiceCampaignForm({ campaign, onSave, onCancel }) {
  const [data, setData] = useState(campaign || {
    name: '',
    description: '',
    inactivity_days: 7,
    script_text: '',
    funnel_stages: [],
    interest_types: [],
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    calling_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    max_attempts_per_lead: 3,
    is_active: true
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!data.name || !data.script_text) {
      alert('Nome e script são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      await onSave(data);
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

  return (
    <div className="space-y-6">
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

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Input
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          placeholder="Descrição opcional"
        />
      </div>

      <div className="space-y-2">
        <Label>Script de Voz*</Label>
        <Textarea
          value={data.script_text}
          onChange={(e) => setData({ ...data, script_text: e.target.value })}
          placeholder="Olá, tudo bem? Estou ligando da clínica..."
          className="min-h-20"
        />
      </div>

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
              <span className="text-sm text-slate-700">{dayLabels[day]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Máximo de Tentativas por Lead</Label>
        <Input
          type="number"
          min="1"
          max="5"
          value={data.max_attempts_per_lead}
          onChange={(e) => setData({ ...data, max_attempts_per_lead: parseInt(e.target.value) })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={data.is_active}
          onCheckedChange={(checked) => setData({ ...data, is_active: checked })}
        />
        <Label className="cursor-pointer">Ativa</Label>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600">
          {saving ? 'Salvando...' : 'Salvar Campanha'}
        </Button>
      </div>
    </div>
  );
}