import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';
import WhatsAppCardBaileys from '../components/channels/WhatsAppCardBaileys';
import InstagramCard from '../components/channels/InstagramCard';
import FacebookCard from '../components/channels/FacebookCard';

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
        <WhatsAppCardBaileys
          connection={whatsappConnection}
          onRefresh={loadConnections}
        />
        <InstagramCard />
        <FacebookCard />
      </div>
    </div>
  );
}