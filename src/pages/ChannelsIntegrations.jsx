import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';
import WhatsAppCardSimple from '../components/channels/WhatsAppCardSimple';

export default function ChannelsIntegrations() {
  const [connection, setConnection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    try {
      const data = await base44.entities.ChannelConnection.list('-updated_date', 1);
      if (data.length > 0) {
        setConnection(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar conexão:', error);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Canais & Integrações</h1>
        <p className="text-slate-600 mt-2">Central de conexão com canais externos</p>
      </div>

      <div className="max-w-md">
        <WhatsAppCardSimple
          connection={connection}
          onRefresh={loadConnection}
        />
      </div>
    </div>
  );
}