import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';
import WhatsAppCard from '../components/channels/WhatsAppCard';
import InstagramCard from '../components/channels/InstagramCard';
import FacebookCard from '../components/channels/FacebookCard';

export default function Conexoes() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const data = await base44.entities.ChannelIntegration.list('-updated_date', 100);
      setIntegrations(data);
    } catch (error) {
      console.error('Erro ao carregar integrações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationByType = (type) => {
    return integrations.find(i => i.channel_type === type);
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
        <h1 className="text-3xl font-bold text-slate-900">Conexões</h1>
        <p className="text-slate-600 mt-2">Central de integrações com canais externos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WhatsAppCard
          integration={getIntegrationByType('whatsapp')}
          onRefresh={loadIntegrations}
        />
        <InstagramCard
          integration={getIntegrationByType('instagram')}
          onRefresh={loadIntegrations}
        />
        <FacebookCard
          integration={getIntegrationByType('facebook')}
          onRefresh={loadIntegrations}
        />
      </div>
    </div>
  );
}