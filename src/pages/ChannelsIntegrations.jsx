import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';
import WhatsAppConnect from '../components/WhatsAppConnect';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Facebook, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function ChannelsIntegrations() {
  const [whatsappConnection, setWhatsappConnection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await base44.entities.ChannelConnection.filter({ channel_type: 'whatsapp' });
      if (data.length > 0) {
        setWhatsappConnection(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Canais & Integrações</h1>
        <p className="text-slate-600 mt-2">Conecte seus canais de comunicação para gerenciar leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WhatsAppConnect
          connection={whatsappConnection}
          onRefresh={loadConnections}
        />
        
        {/* Instagram Card */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-6 h-6" style={{ color: '#E4405F' }} />
                <div>
                  <CardTitle className="text-lg">Instagram</CardTitle>
                  <p className="text-xs text-slate-500">Direct + Comentários</p>
                </div>
              </div>
              <Badge className="bg-slate-100 text-slate-800">⊘ Desconectado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <p className="font-medium">OAuth Facebook Business</p>
                  <p className="mt-1">Conecte via login Facebook para acessar Direct e comentários</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => toast.info('Conectar Instagram: Em desenvolvimento')}
              variant="outline"
              className="w-full"
            >
              Conectar Instagram
            </Button>
          </CardContent>
        </Card>

        {/* Facebook Card */}
        <Card className="bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Facebook className="w-6 h-6 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Facebook</CardTitle>
                  <p className="text-xs text-slate-500">Pages + Messenger</p>
                </div>
              </div>
              <Badge className="bg-slate-100 text-slate-800">⊘ Desconectado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-500 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <p className="font-medium">OAuth Facebook Business</p>
                  <p className="mt-1">Conecte suas páginas do Facebook para gerenciar mensagens</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => toast.info('Conectar Facebook: Em desenvolvimento')}
              variant="outline"
              className="w-full"
            >
              Conectar Facebook
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}