import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isOrgLevel } from '@/components/hierarchy/HierarchyUtils';
import { toast } from 'sonner';
import PoweredBy from '@/components/branding/PoweredBy';
import CliniqLogo from '@/components/branding/CliniqLogo';

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teamMember, setTeamMember] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [brandingConfig, setBrandingConfig] = useState({
    show_powered_by: true,
    show_logo_seal: false,
    ai_message_signature: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length === 0) {
        navigate('/');
        return;
      }

      const tm = teamMembers[0];
      setTeamMember(tm);

      // Only org admins can access this
      if (!isOrgLevel(tm)) {
        navigate('/Dashboard');
        return;
      }

      const orgs = await base44.entities.Organization.filter({ id: tm.organization_id });
      if (orgs.length > 0) {
        const org = orgs[0];
        setOrganization(org);
        
        if (org.branding_config) {
          setBrandingConfig({
            show_powered_by: org.branding_config.show_powered_by !== false,
            show_logo_seal: org.branding_config.show_logo_seal || false,
            ai_message_signature: org.branding_config.ai_message_signature || false
          });
        }
      }
    } catch (error) {
      console.error('Error loading organization settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await base44.entities.Organization.update(organization.id, {
        branding_config: brandingConfig
      });

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações da Organização</h1>
        <p className="text-sm text-slate-600 mt-1">
          Gerencie configurações globais da organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            Marca CLINIQ.AI
          </CardTitle>
          <CardDescription>
            Configure como a marca CLINIQ.AI é exibida em sua plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Examples */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">Logo Completo</p>
              <div className="bg-white p-4 rounded border border-slate-200 flex items-center justify-center">
                <CliniqLogo variant="full" size="lg" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">Monocromático</p>
              <div className="bg-white p-4 rounded border border-slate-200 flex items-center justify-center">
                <CliniqLogo variant="monochrome" size="lg" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">Ícone</p>
              <div className="bg-white p-4 rounded border border-slate-200 flex items-center justify-center">
                <CliniqLogo variant="icon" size="lg" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs font-medium text-slate-600 mb-3">Pré-visualização do Selo:</p>
            <div className="space-y-3">
              {brandingConfig.show_powered_by && (
                <div className="bg-white p-3 rounded border border-slate-200">
                  <PoweredBy variant="dashboard" showLogo={brandingConfig.show_logo_seal} />
                </div>
              )}
              {brandingConfig.ai_message_signature && (
                <div className="bg-white p-3 rounded border border-slate-200">
                  <p className="text-sm text-slate-700 mb-2">Olá! Como posso ajudar?</p>
                  <PoweredBy variant="message" showLogo={brandingConfig.show_logo_seal} />
                </div>
              )}
              {!brandingConfig.show_powered_by && !brandingConfig.ai_message_signature && (
                <p className="text-xs text-slate-500 italic">Nenhuma marca CLINIQ.AI será exibida</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Exibir nos Dashboards</Label>
                <p className="text-sm text-slate-600">
                  Mostra "powered by CLINIQ.AI" no rodapé dos dashboards internos
                </p>
              </div>
              <Switch
                checked={brandingConfig.show_powered_by}
                onCheckedChange={(checked) => 
                  setBrandingConfig({ ...brandingConfig, show_powered_by: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Incluir Logo no Selo</Label>
                <p className="text-sm text-slate-600">
                  Adiciona o ícone da CLINIQ.AI junto ao texto "powered by"
                </p>
              </div>
              <Switch
                checked={brandingConfig.show_logo_seal}
                onCheckedChange={(checked) => 
                  setBrandingConfig({ ...brandingConfig, show_logo_seal: checked })
                }
                disabled={!brandingConfig.show_powered_by && !brandingConfig.ai_message_signature}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Assinatura em Mensagens de IA</Label>
                <p className="text-sm text-slate-600">
                  Adiciona uma assinatura discreta nas mensagens automáticas da IA
                </p>
              </div>
              <Switch
                checked={brandingConfig.ai_message_signature}
                onCheckedChange={(checked) => 
                  setBrandingConfig({ ...brandingConfig, ai_message_signature: checked })
                }
              />
            </div>
          </div>

          {/* Info box */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Nota:</span> Essas configurações são gerenciadas apenas no nível da organização. 
              Unidades individuais não podem alterar essas preferências de marca.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}