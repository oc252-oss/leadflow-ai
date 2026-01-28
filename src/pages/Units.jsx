import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2, Plus, Pencil, Trash2, MapPin, Clock, Phone, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

export default function Units() {
  const [units, setUnits] = useState([]);
  const [brands, setBrands] = useState([]);
  const [teamMember, setTeamMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
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

        const [unitsData, brandsData] = await Promise.all([
          base44.entities.Unit.filter({ organization_id: orgId }),
          base44.entities.Brand.filter({ organization_id: orgId })
        ]);

        setUnits(unitsData);
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('Erro ao carregar unidades:', error);
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
        ...formData,
        organization_id: teamMember.organization_id,
        brand_id: formData.brand_id || null
      };

      if (editingUnit) {
        await base44.entities.Unit.update(editingUnit.id, dataToSave);
        toast.success('Unidade atualizada com sucesso');
      } else {
        await base44.entities.Unit.create(dataToSave);
        toast.success('Unidade criada com sucesso');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar unidade:', error);
      toast.error('Erro ao salvar unidade');
    }
  };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      brand_id: unit.brand_id || '',
      name: unit.name || '',
      code: unit.code || '',
      type: unit.type || 'clinic',
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
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade?')) return;
    
    try {
      await base44.entities.Unit.delete(id);
      toast.success('Unidade excluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir unidade:', error);
      toast.error('Erro ao excluir unidade');
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingUnit(null);
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
      headquarters: 'Sede'
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
          <h1 className="text-3xl font-bold text-slate-900">Unidades</h1>
          <p className="text-slate-500 mt-1">Gerencie clínicas, franquias e filiais</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {/* Empty State */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma unidade cadastrada</h3>
            <p className="text-slate-500 text-center mb-6 max-w-md">
              Para continuar, cadastre ao menos uma unidade. Unidades são clínicas, franquias ou filiais da sua organização.
            </p>
            <Button onClick={() => setShowDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Primeira Unidade
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Units Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <Card key={unit.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <div>
                      <CardTitle className="text-base">{unit.name}</CardTitle>
                      {unit.code && (
                        <p className="text-xs text-slate-500 mt-1">Código: {unit.code}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={unit.status === 'active' ? 'default' : 'secondary'}>
                    {unit.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{getTypeLabel(unit.type)}</Badge>
                  <span className="text-slate-500">{getBrandName(unit.brand_id)}</span>
                </div>

                {unit.city && unit.state && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{unit.city} - {unit.state}</span>
                  </div>
                )}

                {unit.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{unit.phone}</span>
                  </div>
                )}

                {unit.manager_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{unit.manager_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{unit.business_hours_start} - {unit.business_hours_end}</span>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(unit)} className="flex-1">
                    <Pencil className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(unit.id)}
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
            <DialogTitle>{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
            <DialogDescription>
              {editingUnit ? 'Atualize as informações da unidade' : 'Cadastre uma nova unidade da organização'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Unidade *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Clínica Centro"
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="SP001"
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
                      <SelectValue placeholder="Sem marca específica" />
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
                    <SelectItem value="headquarters">Sede</SelectItem>
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
                  placeholder="contato@clinica.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                placeholder="Nome do gerente/responsável"
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
              {editingUnit ? 'Atualizar' : 'Criar Unidade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}