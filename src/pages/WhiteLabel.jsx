import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Palette, Globe, Image, Type, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WhiteLabel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [teamMember, setTeamMember] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    branding_config: {
      show_powered_by: true,
      ai_message_signature: false,
      primary_color: '#4F46E5',
      secondary_color: '#7C3AED',
      custom_domain: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      const teamMembers = await base44.entities.TeamMember.filter({ user_email: user.email });
      
      if (teamMembers.length > 0) {
        setTeamMember(teamMembers[0]);
        
        // Only org admins can access this
        if (teamMembers[0].role !== 'organization_admin') {
          toast.error('Acesso restrito a administradores da organização');
          window.location.href = '/Dashboard';
          return;
        }

        const orgs = await base44.entities.Organization.filter({ 
          id: teamMembers[0].organization_id 
        });
        
        if (orgs.length > 0) {
          const org = orgs[0];
          setOrganization(org);
          setFormData({
            name: org.name || '',
            logo: org.logo || '',
            branding_config: {
              show_powered_by: org.branding_config?.show_powered_by !== false,
              ai_message_signature: org.branding_config?.ai_message_signature || false,
              primary_color: org.branding_config?.primary_color || '#4F46E5',
              secondary_color: org.branding_config?.secondary_color || '#7C3AED',
              custom_domain: org.branding_config?.custom_domain || ''
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await base44.entities.Organization.update(organization.id, {
        name: formData.name,
        logo: formData.logo,
        branding_config: formData.branding_config
      });

      toast.success('Configurações salvas com sucesso');
      await loadData();
    } catch (error) {
      console.error('Error saving organization:', error);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marca & White-label</h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure a identidade visual da sua plataforma
          </p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
          Organização Admin
        </Badge>
      </div>

      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-slate-600" />
            Identidade da Marca
          </CardTitle>
          <CardDescription>
            Configure o nome e logo da sua plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Plataforma</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: MinhaMarca CRM"
            />
          </div>

          <div className="space-y-2">
            <Label>URL do Logo</Label>
            <Input
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            {formData.logo && (
              <div className="mt-3 p-4 border rounded-lg bg-slate-50">
                <p className="text-xs text-slate-600 mb-2">Prévia:</p>
                <img 
                  src={formData.logo} 
                  alt="Logo preview" 
                  className="h-12 object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-slate-600" />
            Cores da Marca
          </CardTitle>
          <CardDescription>
            Personalize as cores principais da interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.branding_config.primary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    branding_config: { 
                      ...formData.branding_config, 
                      primary_color: e.target.value 
                    }
                  })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.branding_config.primary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    branding_config: { 
                      ...formData.branding_config, 
                      primary_color: e.target.value 
                    }
                  })}
                  placeholder="#4F46E5"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.branding_config.secondary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    branding_config: { 
                      ...formData.branding_config, 
                      secondary_color: e.target.value 
                    }
                  })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.branding_config.secondary_color}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    branding_config: { 
                      ...formData.branding_config, 
                      secondary_color: e.target.value 
                    }
                  })}
                  placeholder="#7C3AED"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-600" />
            Domínio Personalizado
          </CardTitle>
          <CardDescription>
            Configure um domínio próprio para sua plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Domínio Customizado</Label>
            <Input
              value={formData.branding_config.custom_domain}
              onChange={(e) => setFormData({ 
                ...formData, 
                branding_config: { 
                  ...formData.branding_config, 
                  custom_domain: e.target.value 
                }
              })}
              placeholder="app.suamarca.com.br"
            />
            <p className="text-xs text-slate-500">
              Configure o DNS do seu domínio para apontar para a plataforma
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-slate-600" />
            Opções de Marca
          </CardTitle>
          <CardDescription>
            Configure a exibição da marca CLINIQ.AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Mostrar "Powered by CLINIQ.AI"</Label>
              <p className="text-xs text-slate-500 mt-1">
                Exibe o selo CLINIQ.AI no rodapé dos dashboards
              </p>
            </div>
            <Switch
              checked={formData.branding_config.show_powered_by}
              onCheckedChange={(v) => setFormData({ 
                ...formData, 
                branding_config: { 
                  ...formData.branding_config, 
                  show_powered_by: v 
                }
              })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label>Assinatura em Mensagens de IA</Label>
              <p className="text-xs text-slate-500 mt-1">
                Adiciona "Powered by CLINIQ.AI" nas mensagens do assistente
              </p>
            </div>
            <Switch
              checked={formData.branding_config.ai_message_signature}
              onCheckedChange={(v) => setFormData({ 
                ...formData, 
                branding_config: { 
                  ...formData.branding_config, 
                  ai_message_signature: v 
                }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}