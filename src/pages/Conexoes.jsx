import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Instagram, Facebook, Phone, Plus, Settings } from 'lucide-react';

export default function Conexoes() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await base44.entities.Connection.list();
      setConnections(data);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'whatsapp': return MessageSquare;
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'voz': return Phone;
      default: return MessageSquare;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'conectado': return 'bg-green-100 text-green-800';
      case 'desconectado': return 'bg-slate-100 text-slate-600';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-600';
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Conexões</h1>
          <p className="text-slate-600">Gerencie integrações externas</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((conn) => {
          const Icon = getIcon(conn.type);
          return (
            <Card key={conn.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{conn.name}</CardTitle>
                      <CardDescription className="capitalize">{conn.type}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(conn.status)}>
                    {conn.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {conn.phone_number && (
                  <div className="text-sm">
                    <span className="text-slate-500">Número:</span>
                    <span className="ml-2 font-medium">{conn.phone_number}</span>
                  </div>
                )}
                {conn.last_sync && (
                  <div className="text-sm text-slate-500">
                    Última sinc: {new Date(conn.last_sync).toLocaleDateString()}
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Settings className="w-4 h-4" />
                  Configurar
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {connections.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Nenhuma conexão configurada</p>
              <Button className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Primeira Conexão
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}