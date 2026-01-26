import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Building2, Save, Clock, Globe, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [teamMember, setTeamMember] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    industry: 'healthcare',
    timezone: 'America/Sao_Paulo',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    ai_enabled: true,
    status: 'active'
  });

  const industries = [
    { value: 'healthcare', label: 'Saúde' },
    { value: 'franchise', label: 'Franquia' },
    { value: 'real_estate', label: 'Imobiliário' },
    { value: 'education', label: 'Educação' },
    { value: 'services', label: 'Serviços' },
    { value: 'retail', label: 'Varejo' },
    { value: 'other', label: 'Outro' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
    { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' }
  ];

  const weekDays = [
    { value: 'monday', label: 'Segunda' },
    { value: 'tuesday', label: 'Terça' },
    { value: 'wednesday', label: 'Quarta' },
    { value: 'thursday', label: 'Quinta' },
    { value: 'friday', label: 'Sexta' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  const statuses = [
    { value: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inativo', color: 'bg-red-100 text-red-800' },
    { value: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) {
        toast.error('Você não está associado a nenhuma empresa');
        return;
      }

      setTeamMember(teamMembers[0]);
      const companies = await base44.entities.Company.filter({ id: teamMembers[0].company_id });
      
      if (companies.length === 0) {
        toast.error('Empresa não encontrada');
        return;
      }

      const companyData = companies[0];
      setCompany(companyData);
      
      setFormData({
        name: companyData.name || '',
        logo: companyData.logo || '',
        industry: companyData.industry || 'healthcare',
        timezone: companyData.timezone || 'America/Sao_Paulo',
        business_hours_start: companyData.business_hours_start || '09:00',
        business_hours_end: companyData.business_hours_end || '18:00',
        working_days: companyData.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ai_enabled: companyData.ai_enabled !== false,
        status: companyData.status || 'active'
      });
    } catch (error) {
      toast.error('Erro ao carregar dados da empresa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.name) {
        toast.error('Nome da empresa é obrigatório');
        return;
      }

      if (!formData.business_hours_start || !formData.business_hours_end) {
        toast.error('Configure o horário de funcionamento');
        return;
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.business_hours_start) || !timeRegex.test(formData.business_hours_end)) {
        toast.error('Formato de horário inválido. Use HH:MM');
        return;
      }

      if (formData.working_days.length === 0) {
        toast.error('Selecione pelo menos um dia de funcionamento');
        return;
      }

      setSaving(true);
      await base44.entities.Company.update(company.id, formData);
      toast.success('Configurações salvas com sucesso');
      await loadData();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (day) => {
    if (formData.working_days.includes(day)) {
      setFormData({
        ...formData,
        working_days: formData.working_days.filter(d => d !== day)
      });
    } else {
      setFormData({
        ...formData,
        working_days: [...formData.working_days, day]
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">Empresa não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações da Empresa</h1>
          <p className="text-slate-500 mt-1">Gerencie as informações e configurações da sua empresa</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Informações Básicas
          </CardTitle>
          <CardDescription>Dados principais da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Empresa *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da empresa"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
            />
            {formData.logo && (
              <div className="mt-2">
                <img src={formData.logo} alt="Logo preview" className="h-16 object-contain border rounded-lg p-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {industries.map(ind => (
                    <SelectItem key={ind.value} value={ind.value}>{ind.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Configure os dias e horários de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Início *</Label>
              <Input
                type="time"
                value={formData.business_hours_start}
                onChange={(e) => setFormData({ ...formData, business_hours_start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário de Término *</Label>
              <Input
                type="time"
                value={formData.business_hours_end}
                onChange={(e) => setFormData({ ...formData, business_hours_end: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias de Funcionamento *</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  variant={formData.working_days.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleWorkingDay(day.value)}
                  className={formData.working_days.includes(day.value) ? 'bg-indigo-600' : ''}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Fuso Horário
            </Label>
            <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Configuração de IA
          </CardTitle>
          <CardDescription>Configure o comportamento da inteligência artificial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base">Atendimento Automatizado por IA</Label>
              <p className="text-sm text-slate-500 mt-1">
                Ativa o atendimento automático e qualificação de leads por IA
              </p>
            </div>
            <Switch
              checked={formData.ai_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, ai_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}