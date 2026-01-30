import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, UserPlus, Mail, Shield, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from "sonner";

export default function Team() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('sales_agent');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const companyData = await base44.entities.Company.filter({ id: members[0].company_id });
        if (companyData.length > 0) {
          setCompany(companyData[0]);
          const allMembers = await base44.entities.TeamMember.filter({ company_id: companyData[0].id });
          setTeamMembers(allMembers);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      toast.error('Erro ao carregar dados da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error('Digite um email válido');
      return;
    }

    if (!company) {
      toast.error('Empresa não encontrada');
      return;
    }

    setInviting(true);
    try {
      // Primeiro criar o TeamMember pendente
      const newMember = await base44.entities.TeamMember.create({
        organization_id: company.organization_id || null,
        company_id: company.id,
        user_email: inviteEmail,
        role: inviteRole,
        status: 'active',
        max_concurrent_leads: inviteRole === 'sales_agent' ? 20 : 50,
        assigned_leads_count: 0
      });

      // Depois enviar o convite via Base44
      await base44.users.inviteUser(inviteEmail, inviteRole === 'organization_admin' ? 'admin' : 'user');

      toast.success('Convite enviado! Quando o usuário aceitar, o registro será ativado automaticamente.');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('sales_agent');
      await loadData();
    } catch (error) {
      console.error('Erro ao convidar:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (!confirm('Deseja realmente remover este membro da equipe?')) return;

    try {
      await base44.entities.TeamMember.delete(memberId);
      toast.success('Membro removido');
      await loadData();
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleToggleStatus = async (member) => {
    try {
      await base44.entities.TeamMember.update(member.id, {
        status: member.status === 'active' ? 'inactive' : 'active'
      });
      toast.success('Status atualizado');
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const roleLabels = {
    platform_admin: 'Administrador da Plataforma',
    organization_admin: 'Administrador',
    brand_manager: 'Gerente de Marca',
    unit_admin: 'Administrador da Unidade',
    sales_manager: 'Gerente de Vendas',
    sales_agent: 'Agente de Vendas / Atendente'
  };

  const roleColors = {
    platform_admin: 'bg-purple-100 text-purple-800',
    organization_admin: 'bg-indigo-100 text-indigo-800',
    brand_manager: 'bg-blue-100 text-blue-800',
    unit_admin: 'bg-cyan-100 text-cyan-800',
    sales_manager: 'bg-green-100 text-green-800',
    sales_agent: 'bg-slate-100 text-slate-700'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe</h1>
          <p className="text-slate-600">Gerencie atendentes e membros da equipe</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <UserPlus className="w-4 h-4" />
          Convidar Membro
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Membros da Equipe</CardTitle>
          <CardDescription>
            {teamMembers.length} membro(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{member.user_email}</p>
                      {member.status === 'active' ? (
                        <Badge className="gap-1 bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="gap-1 bg-slate-100 text-slate-600">
                          <XCircle className="w-3 h-3" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge className={roleColors[member.role]}>
                        <Shield className="w-3 h-3 mr-1" />
                        {roleLabels[member.role] || member.role}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {member.assigned_leads_count || 0} / {member.max_concurrent_leads || 20} leads atribuídos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(member)}
                  >
                    {member.status === 'active' ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {teamMembers.length === 0 && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum membro cadastrado</h3>
                <p className="text-slate-500 mb-6">Comece convidando membros para sua equipe</p>
                <Button onClick={() => setShowInviteDialog(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4" />
                  Convidar Primeiro Membro
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Convidar Membro */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Convidar Membro da Equipe</DialogTitle>
            <DialogDescription>
              Envie um convite por email para um novo membro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função *</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_agent">Agente de Vendas / Atendente</SelectItem>
                  <SelectItem value="sales_manager">Gerente de Vendas</SelectItem>
                  <SelectItem value="unit_admin">Administrador da Unidade</SelectItem>
                  <SelectItem value="organization_admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Agentes podem atender conversas e gerenciar leads
              </p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900">
                Um email de convite será enviado para o endereço fornecido com instruções para criar a conta.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {inviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}