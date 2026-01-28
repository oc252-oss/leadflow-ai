import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Users, Zap, Clock, Globe, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const [companyForm, setCompanyForm] = useState({
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

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'sales_agent' });

  const industries = [
    { value: 'healthcare', label: 'Saúde' },
    { value: 'aesthetics', label: 'Estética' },
    { value: 'dental', label: 'Odontologia' },
    { value: 'franchises', label: 'Franquias' },
    { value: 'services', label: 'Serviços' },
    { value: 'retail', label: 'Varejo' },
    { value: 'other', label: 'Outro' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Acre (GMT-5)' }
  ];

  const weekDays = [
    { value: 'monday', label: 'Seg' },
    { value: 'tuesday', label: 'Ter' },
    { value: 'wednesday', label: 'Qua' },
    { value: 'thursday', label: 'Qui' },
    { value: 'friday', label: 'Sex' },
    { value: 'saturday', label: 'Sáb' },
    { value: 'sunday', label: 'Dom' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length === 0) {
        toast.error('Você não está associado a nenhuma empresa');
        return;
      }

      setTeamMember(members[0]);
      const companyId = members[0].company_id;

      const [companyData, teamData] = await Promise.all([
        base44.entities.Company.filter({ id: companyId }),
        base44.entities.TeamMember.filter({ company_id: companyId })
      ]);

      if (companyData.length > 0) {
        const comp = companyData[0];
        setCompany(comp);
        setCompanyForm({
          name: comp.name || '',
          logo: comp.logo || '',
          industry: comp.industry || 'healthcare',
          timezone: comp.timezone || 'America/Sao_Paulo',
          business_hours_start: comp.business_hours_start || '09:00',
          business_hours_end: comp.business_hours_end || '18:00',
          working_days: comp.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          ai_enabled: comp.ai_enabled !== false,
          status: comp.status || 'active'
        });
      }

      setTeamMembers(teamData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company) return;

    if (!companyForm.name) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Company.update(company.id, companyForm);
      toast.success('Configurações salvas com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteForm.email || !company) return;
    
    setSaving(true);
    try {
      await base44.users.inviteUser(inviteForm.email, inviteForm.role);
      
      const newMember = await base44.entities.TeamMember.create({
        company_id: company.id,
        organization_id: teamMember.organization_id,
        user_email: inviteForm.email,
        role: inviteForm.role,
        status: 'active'
      });
      
      setTeamMembers([...teamMembers, newMember]);
      setShowInviteDialog(false);
      setInviteForm({ email: '', role: 'sales_agent' });
      toast.success('Convite enviado com sucesso');
    } catch (error) {
      console.error('Erro ao convidar:', error);
      toast.error('Erro ao enviar convite');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;
    
    try {
      await base44.entities.TeamMember.delete(memberId);
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
      toast.success('Membro removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const toggleWorkingDay = (day) => {
    if (companyForm.working_days.includes(day)) {
      setCompanyForm({
        ...companyForm,
        working_days: companyForm.working_days.filter(d => d !== day)
      });
    } else {
      setCompanyForm({
        ...companyForm,
        working_days: [...companyForm.working_days, day]
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie empresa, equipe e preferências</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Informações da Empresa
          </CardTitle>
          <CardDescription>Dados básicos e configurações gerais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Segmento</Label>
              <Select value={companyForm.industry} onValueChange={(value) => setCompanyForm({ ...companyForm, industry: value })}>
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
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={companyForm.logo}
              onChange={(e) => setCompanyForm({ ...companyForm, logo: e.target.value })}
              placeholder="https://exemplo.com/logo.png"
            />
            {companyForm.logo && (
              <img src={companyForm.logo} alt="Logo" className="h-12 object-contain mt-2" />
            )}
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
          <CardDescription>Configure horários e fuso horário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Abertura</Label>
              <Input
                type="time"
                value={companyForm.business_hours_start}
                onChange={(e) => setCompanyForm({ ...companyForm, business_hours_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fechamento</Label>
              <Input
                type="time"
                value={companyForm.business_hours_end}
                onChange={(e) => setCompanyForm({ ...companyForm, business_hours_end: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                Fuso Horário
              </Label>
              <Select value={companyForm.timezone} onValueChange={(value) => setCompanyForm({ ...companyForm, timezone: value })}>
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
          </div>

          <div className="space-y-2">
            <Label>Dias de Funcionamento</Label>
            <div className="flex gap-2">
              {weekDays.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  variant={companyForm.working_days.includes(day.value) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleWorkingDay(day.value)}
                  className={companyForm.working_days.includes(day.value) ? 'bg-indigo-600' : ''}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            Inteligência Artificial
          </CardTitle>
          <CardDescription>Ative ou desative IA no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base">Atendimento por IA</Label>
              <p className="text-sm text-slate-500 mt-1">
                Habilita assistentes virtuais e automações inteligentes
              </p>
            </div>
            <Switch
              checked={companyForm.ai_enabled}
              onCheckedChange={(checked) => setCompanyForm({ ...companyForm, ai_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Equipe
            </CardTitle>
            <CardDescription>Gerencie membros e permissões</CardDescription>
          </div>
          <Button onClick={() => setShowInviteDialog(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Convidar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user_email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {member.role?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      member.status === 'active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                    )}>
                      {member.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>Envie um convite para participar da equipe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company_admin">Administrador</SelectItem>
                  <SelectItem value="sales_manager">Gerente de Vendas</SelectItem>
                  <SelectItem value="sales_agent">Agente de Vendas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleInviteMember}
              disabled={!inviteForm.email || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}