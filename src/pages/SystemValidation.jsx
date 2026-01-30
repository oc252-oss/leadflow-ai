import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { toast } from "sonner";

export default function SystemValidation() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('validateAndSetupSystem', {});
      setReport(result.data);
      
      if (result.data.summary.allReady) {
        toast.success('Sistema validado com sucesso! Todos os componentes estão prontos.');
      } else {
        toast.warning('Sistema validado. Alguns componentes foram criados ou precisam de atenção.');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      toast.error('Erro ao validar sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validação do Sistema</h1>
          <p className="text-slate-600">Verificar e configurar componentes essenciais</p>
        </div>
        <Button 
          onClick={runValidation}
          disabled={loading}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Executar Validação
            </>
          )}
        </Button>
      </div>

      {!report && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
              <Play className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Pronto para validar</h3>
            <p className="text-slate-500 mb-6">
              Clique em "Executar Validação" para verificar o sistema
            </p>
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-4">
          {/* Resumo */}
          <Card className={`border-2 ${report.summary.allReady ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
            <CardHeader>
              <div className="flex items-center gap-3">
                {report.summary.allReady ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
                <div>
                  <CardTitle>
                    {report.summary.allReady ? 'Sistema Completo ✓' : 'Sistema Configurado'}
                  </CardTitle>
                  <CardDescription>
                    {report.summary.allReady 
                      ? 'Todos os componentes estão funcionais'
                      : 'Alguns componentes foram criados ou precisam de atenção'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Pipeline */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {report.report.pipeline.exists ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Pipeline de Vendas (CRM)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  {report.report.pipeline.exists ? (
                    <>
                      ✓ Pipeline configurado
                      {report.report.pipeline.created && ' (criado agora)'}
                    </>
                  ) : (
                    '✗ Pipeline não encontrado'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fluxo de Qualificação */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {report.report.qualificationFlow.exists || report.report.qualificationFlow.created ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Fluxo de Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  {report.report.qualificationFlow.exists ? (
                    '✓ Fluxo de qualificação já existia'
                  ) : report.report.qualificationFlow.created ? (
                    '✓ Fluxo de qualificação criado com sucesso'
                  ) : (
                    '✗ Fluxo não encontrado'
                  )}
                </p>
                {report.report.qualificationFlow.flowId && (
                  <Badge variant="outline" className="text-xs">
                    ID: {report.report.qualificationFlow.flowId}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Integrações */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {report.report.integrations.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                Integrações IA + CRM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.report.integrations.valid ? (
                  <p className="text-sm text-green-700">✓ Assistentes IA configurados</p>
                ) : (
                  <p className="text-sm text-amber-700">⚠ Verificar configurações</p>
                )}
                {report.report.integrations.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {report.report.integrations.issues.map((issue, idx) => (
                      <p key={idx} className="text-xs text-slate-600">• {issue}</p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Handoff Humano */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {report.report.handoff.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Handoff Humano (IA → Atendente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-slate-600">
                  ✓ Sistema de transferência configurado
                </p>
                {report.report.handoff.details && (
                  <div className="mt-3 text-xs text-slate-600 space-y-1">
                    <p>• Gatilhos automáticos: {report.report.handoff.details.keywords.join(', ')}</p>
                    <p>• Transferência automática: {report.report.handoff.details.automaticTransfer ? 'Sim' : 'Não'}</p>
                    <p>• Takeover manual: {report.report.handoff.details.manualTakeover ? 'Sim' : 'Não'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}