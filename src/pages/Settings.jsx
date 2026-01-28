import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, MapPin, Clock, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function Settings() {
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    brand_id: '',
    name: '',
    code: '',
    type: 'clinic',
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        setTeamMember(members[0]);
        const orgId = members[0].organization_id;

        const [companiesData, brandsData] = await Promise.all([
          base44.entities.Unit.filter({ organization_id: orgId }),
          base44.entities.Brand.filter({ organization_id: orgId })
        ]);

        setCompanies(companiesData);
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name,
        organization_id: teamMember.organization_id,
        code: formData.code,
        type: formData.type,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        phone: formData.phone,
        email: formData.email,
        manager_name: formData.manager_name,
        business_hours_start: formData.business_hours_start,
        business_hours_end: formData.business_hours_end,
        timezone: formData.timezone,
        status: formData.status
      };

      if (formData.brand_id && formData.brand_id !== '') {
        dataToSave.brand_id = formData.brand_id;
      }

      if (editingCompany) {
        await base44.entities.Unit.update(editingCompany.id, dataToSave);
        toast.success('Empresa atualizada com sucesso');
      } else {
        await base44.entities.Unit.create(dataToSave);
        toast.success('Empresa criada com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error(`Erro ao salvar: ${error.message || 'Tente novamente'}`);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      brand_id: company.brand_id || '',
      name: company.name || '',
      code: company.code || '',
      type: company.type || 'clinic',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      postal_code: company.postal_code || '',
      phone: company.phone || '',
      email: company.email || '',
      manager_name: company.manager_name || '',
      business_hours_start: company.business_hours_start || '09:00',
      business_hours_end: company.business_hours_end || '18:00',
      timezone: company.timezone || 'America/Sao_Paulo',
      status: company.status || 'active'
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    
    try {
      await base44.entities.Unit.delete(id);
      toast.success('Empresa excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCompany(null);
    setFormData({
      brand_id: '',
      name: '',
      code: '',
      type: 'clinic',
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
  };

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || '-';
  };

  const getTypeLabel = (type) => {
    const labels = {
      clinic: 'Clínica',
      franchise: 'Franquia',
      headquarters: 'Matriz'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie suas empresas e unidades</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Empty State */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-slate-500 text-center mb-6 max-w-md">
              Cadastre sua primeira empresa para começar a usar o sistema.
            </p>
            <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Empresa
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Companies Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <CardTitle className="text-base">{company.name}</CardTitle>
                      {company.code && (
                        <p className="text-xs text-slate-500 mt-1">Código: {company.code}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={company.status === 'active' ? 'default' : 'secondary'}>
                    {company.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{getTypeLabel(company.type)}</Badge>
                  {company.brand_id && (
                    <span className="text-slate-500">{getBrandName(company.brand_id)}</span>
                  )}
                </div>

                {company.city && company.state && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{company.city} - {company.state}</span>
                  </div>
                )}

                {company.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{company.phone}</span>
                  </div>
                )}

                {company.manager_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{company.manager_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{company.business_hours_start} - {company.business_hours_end}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)} className="flex-1">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(company.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Atualize as informações da empresa' : 'Cadastre uma nova empresa'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Clínica Exemplo"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="EMP001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {brands.length > 0 && (
                <div className="space-y-2">
                  <Label>Marca (opcional)</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => setFormData({ ...formData, brand_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhuma</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
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
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="SP"
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="01234-567"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>

            {/* Business Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário Abertura</Label>
                <Input
                  type="time"
                  value={formData.business_hours_start}
                  onChange={(e) => setFormData({ ...formData, business_hours_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Fechamento</Label>
                <Input
                  type="time"
                  value={formData.business_hours_end}
                  onChange={(e) => setFormData({ ...formData, business_hours_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                    <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                    <SelectItem value="America/Rio_Branco">Acre (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              {editingCompany ? 'Atualizar' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}