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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Zap, Clock, Globe, Save, Plus, Trash2, Loader2, MapPin, Mail, Phone, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [activeTab, setActiveTab] = useState('company');

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
  
  const [unitForm, setUnitForm] = useState({
    name: '',
    code: '',
    type: 'clinic',
    brand_id: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    manager_name: '',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    timezone: 'America/Sao_Paulo',
    status: 'active'
  });

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

      const [companyData, teamData, unitsData, brandsData] = await Promise.all([
        base44.entities.Company.filter({ id: companyId }),
        base44.entities.TeamMember.filter({ company_id: companyId }),
        base44.entities.Unit.filter({ organization_id: members[0].organization_id }),
        base44.entities.Brand.filter({ organization_id: members[0].organization_id })
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
      setUnits(unitsData);
      setBrands(brandsData);
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

  const handleOpenUnitDialog = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitForm({
        name: unit.name || '',
        code: unit.code || '',
        type: unit.type || 'clinic',
        brand_id: unit.brand_id || '',
        address: unit.address || '',
        city: unit.city || '',
        state: unit.state || '',
        postal_code: unit.postal_code || '',
        phone: unit.phone || '',
        email: unit.email || '',
        manager_name: unit.manager_name || '',
        business_hours_start: unit.business_hours_start || '09:00',
        business_hours_end: unit.business_hours_end || '18:00',
        timezone: unit.timezone || 'America/Sao_Paulo',
        status: unit.status || 'active'
      });
    } else {
      setEditingUnit(null);
      setUnitForm({
        name: '',
        code: '',
        type: 'clinic',
        brand_id: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        phone: '',
        email: '',
        manager_name: '',
        business_hours_start: '09:00',
        business_hours_end: '18:00',
        timezone: 'America/Sao_Paulo',
        status: 'active'
      });
    }
    setShowUnitDialog(true);
  };

  const handleCloseUnitDialog = () => {
    setShowUnitDialog(false);
    setEditingUnit(null);
  };

  const handleSaveUnit = async () => {
    if (!unitForm.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        name: unitForm.name,
        organization_id: teamMember.organization_id,
        code: unitForm.code,
        type: unitForm.type,
        address: unitForm.address,
        city: unitForm.city,
        state: unitForm.state,
        postal_code: unitForm.postal_code,
        phone: unitForm.phone,
        email: unitForm.email,
        manager_name: unitForm.manager_name,
        business_hours_start: unitForm.business_hours_start,
        business_hours_end: unitForm.business_hours_end,
        timezone: unitForm.timezone,
        status: unitForm.status
      };

      if (unitForm.brand_id && unitForm.brand_id !== '') {
        dataToSave.brand_id = unitForm.brand_id;
      }

      if (editingUnit) {
        await base44.entities.Unit.update(editingUnit.id, dataToSave);
        toast.success('Empresa atualizada com sucesso');
      } else {
        await base44.entities.Unit.create(dataToSave);
        toast.success('Empresa criada com sucesso');
      }

      await loadData();
      handleCloseUnitDialog();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error(`Erro ao salvar: ${error.message || 'Tente novamente'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      await base44.entities.Unit.delete(unitId);
      toast.success('Empresa excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  const getBrandName = (brandId) => {
    if (!brandId) return 'Nenhuma';
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : 'Marca não encontrada';
  };

  const formatUnitType = (type) => {
    const types = {
      clinic: 'Clínica',
      franchise: 'Franquia',
      headquarters: 'Matriz'
    };
    return types[type] || type;
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie empresa, equipe e preferências</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company">Informações</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="units">Empresas</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-6 mt-6">
          <div className="flex justify-end">
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
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Empresas Cadastradas
                </CardTitle>
                <CardDescription>Gerencie as empresas da organização</CardDescription>
              </div>
              <Button onClick={() => handleOpenUnitDialog()} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Empresa
              </Button>
            </CardHeader>
            <CardContent>
              {units.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma empresa cadastrada</h3>
                  <p className="text-slate-500 mb-4">Cadastre a primeira empresa para começar</p>
                  <Button onClick={() => handleOpenUnitDialog()} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Empresa
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {units.map((unit) => (
                    <Card key={unit.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{unit.name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{formatUnitType(unit.type)}</Badge>
                              {unit.code && <Badge variant="outline">{unit.code}</Badge>}
                              <Badge className={cn(
                                unit.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                              )}>
                                {unit.status === 'active' ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenUnitDialog(unit)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-600">
                        {unit.manager_name && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{unit.manager_name}</span>
                          </div>
                        )}
                        {unit.city && unit.state && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{unit.city}, {unit.state}</span>
                          </div>
                        )}
                        {unit.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{unit.phone}</span>
                          </div>
                        )}
                        {unit.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{unit.email}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Unit Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            <DialogDescription>Preencha os dados da empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                  placeholder="SP001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={unitForm.type} onValueChange={(value) => setUnitForm({ ...unitForm, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Clínica</SelectItem>
                    <SelectItem value="franchise">Franquia</SelectItem>
                    <SelectItem value="headquarters">Matriz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Select value={unitForm.brand_id} onValueChange={(value) => setUnitForm({ ...unitForm, brand_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Nenhuma</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={unitForm.address}
                onChange={(e) => setUnitForm({ ...unitForm, address: e.target.value })}
                placeholder="Rua, número"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={unitForm.city}
                  onChange={(e) => setUnitForm({ ...unitForm, city: e.target.value })}
                  placeholder="Cidade"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={unitForm.state}
                  onChange={(e) => setUnitForm({ ...unitForm, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={unitForm.postal_code}
                  onChange={(e) => setUnitForm({ ...unitForm, postal_code: e.target.value })}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={unitForm.phone}
                  onChange={(e) => setUnitForm({ ...unitForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={unitForm.email}
                  onChange={(e) => setUnitForm({ ...unitForm, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={unitForm.manager_name}
                onChange={(e) => setUnitForm({ ...unitForm, manager_name: e.target.value })}
                placeholder="Nome do gerente/responsável"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Abertura</Label>
                <Input
                  type="time"
                  value={unitForm.business_hours_start}
                  onChange={(e) => setUnitForm({ ...unitForm, business_hours_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fechamento</Label>
                <Input
                  type="time"
                  value={unitForm.business_hours_end}
                  onChange={(e) => setUnitForm({ ...unitForm, business_hours_end: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select value={unitForm.timezone} onValueChange={(value) => setUnitForm({ ...unitForm, timezone: value })}>
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
              <Label>Status</Label>
              <Select value={unitForm.status} onValueChange={(value) => setUnitForm({ ...unitForm, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="onboarding">Em Implantação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseUnitDialog}>Cancelar</Button>
            <Button 
              onClick={handleSaveUnit}
              disabled={!unitForm.name || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingUnit ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}