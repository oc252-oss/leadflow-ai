import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FacebookCard({ integration, onRefresh }) {
  const [messenger, setMessenger] = useState(integration?.settings?.messenger || false);
  const [comments, setComments] = useState(integration?.settings?.comments || false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!messenger && !comments) {
      toast.error('Selecione pelo menos uma opção');
      return;
    }

    setLoading(true);
    try {
      if (!integration?.id) {
        await base44.entities.ChannelIntegration.create({
          channel_type: 'facebook',
          label: 'Facebook',
          status: 'disconnected',
          settings: { messenger, comments }
        });
        toast.info('Integração criada. Conecte via Meta Business');
      } else {
        await base44.entities.ChannelIntegration.update(integration.id, {
          settings: { messenger, comments }
        });
        toast.success('Configurações atualizadas');
      }
      onRefresh();
    } catch (error) {
      toast.error('Erro ao conectar Facebook');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!integration?.id) return;

    try {
      await base44.entities.ChannelIntegration.update(integration.id, {
        status: 'disconnected',
        connected_account: ''
      });
      setMessenger(false);
      setComments(false);
      toast.success('Facebook desconectado');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Facebook className="w-6 h-6 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Facebook</CardTitle>
              <p className="text-xs text-slate-500">Messenger e Comentários</p>
            </div>
          </div>
          <Badge className={integration?.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
            {integration?.status === 'connected' ? '✓ Conectado' : '⊘ Desconectado'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="fb-messenger"
              checked={messenger}
              onCheckedChange={setMessenger}
              disabled={loading}
            />
            <label htmlFor="fb-messenger" className="text-sm cursor-pointer">
              Conectar Messenger
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="fb-comments"
              checked={comments}
              onCheckedChange={setComments}
              disabled={loading}
            />
            <label htmlFor="fb-comments" className="text-sm cursor-pointer">
              Conectar Comentários
            </label>
          </div>
        </div>

        {integration?.status === 'connected' && integration?.connected_account && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-600 font-medium">Páginas Conectadas</p>
            <p className="text-sm font-medium text-blue-900 mt-1">{integration.connected_account}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {integration?.status === 'connected' ? (
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="flex-1"
            >
              Desconectar
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={loading || (!messenger && !comments)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Conectar Facebook
            </Button>
          )}
        </div>

        <div className="p-2 rounded bg-amber-50 border border-amber-200 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Você será redirecionado para Meta Business para conectar suas páginas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}