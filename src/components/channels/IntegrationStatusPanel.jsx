import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function IntegrationStatusPanel({ 
  whatsappIntegrations = [], 
  instagramIntegrations = [], 
  facebookIntegrations = [] 
}) {
  const allIntegrations = [
    ...whatsappIntegrations.map(w => ({ ...w, type: 'WhatsApp', icon: '💬' })),
    ...instagramIntegrations.map(i => ({ ...i, type: 'Instagram', icon: '📷' })),
    ...facebookIntegrations.map(f => ({ ...f, type: 'Facebook', icon: '👍' }))
  ];

  const statusCounts = {
    connected: allIntegrations.filter(i => i.status === 'connected').length,
    disconnected: allIntegrations.filter(i => i.status === 'disconnected').length,
    error: allIntegrations.filter(i => i.status === 'error').length,
    total: allIntegrations.length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900">{statusCounts.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total de Integrações</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{statusCounts.connected}</p>
              <p className="text-xs text-green-700 mt-1">Conectadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-600">{statusCounts.disconnected}</p>
              <p className="text-xs text-slate-700 mt-1">Desconectadas</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">{statusCounts.error}</p>
              <p className="text-xs text-red-700 mt-1">Erros</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed List */}
      {allIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes das Integrações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allIntegrations.map((integration) => (
              <div 
                key={integration.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg transition-colors",
                  getStatusColor(integration.status)
                )}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(integration.status)}
                  <div>
                    <p className="font-medium text-sm">
                      {integration.label || integration.account_name || integration.page_name || `${integration.type} #${integration.id?.slice(0, 4)}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {integration.type}
                      {integration.phone_number && ` • ${integration.phone_number}`}
                    </p>
                  </div>
                </div>
                <Badge 
                  className={cn(
                    'text-xs',
                    integration.status === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : integration.status === 'error'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-800'
                  )}
                >
                  {getStatusLabel(integration.status)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}