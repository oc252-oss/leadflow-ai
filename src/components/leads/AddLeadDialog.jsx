import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function AddLeadDialog({ open, onOpenChange, onSave, campaigns = [], unit_id = null }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    campaign_id: '',
    interest_type: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || (!formData.phone && !formData.email)) {
      alert('Nome e (telefone ou email) são obrigatórios');
      return;
    }
    
    setSaving(true);
    try {
      await onSave({ ...formData, unit_id });
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'manual',
        campaign_id: '',
        interest_type: '',
        notes: ''
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Lead</DialogTitle>
          <DialogDescription>
            Adicione manualmente um novo lead ao seu pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+55 (11) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="joao@exemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => setFormData({ ...formData, source: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Entrada Manual</SelectItem>
                  <SelectItem value="facebook_lead_ad">Facebook Lead Ad</SelectItem>
                  <SelectItem value="messenger">Messenger</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="referral">Indicação</SelectItem>
                  <SelectItem value="webchat">Webchat</SelectItem>
                  <SelectItem value="import">Importação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {campaigns.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="campaign">Campanha</Label>
                <Select
                  value={formData.campaign_id}
                  onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.campaign_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest">Tipo de Interesse</Label>
            <Input
              id="interest"
              value={formData.interest_type}
              onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
              placeholder="Ex: Botox, Harmonização, Preenchimento"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!formData.name || (!formData.phone && !formData.email) || saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Adicionar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}